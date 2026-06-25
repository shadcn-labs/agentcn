/** Deterministic AI-SEO audit orchestrator (context.dev + rules.ts). */
import { buildAgentFixPrompts } from "./agent-fix-prompt";
import type {
  AuditBand,
  AuditCategory,
  AuditItem,
  AuditResult,
  AuditStatus,
} from "./audit-types";
import { CATEGORIES, RULES, countMatches, countWords } from "./rules";
import type {
  CategoryDef,
  DateSignals,
  Heading,
  JsonObject,
  RuleContext,
  SchemaSummary,
} from "./rules";
import { displayHost } from "./url";

const STATUS_VALUE: Record<AuditStatus, number> = {
  fail: 0,
  na: 0,
  partial: 0.5,
  // N/A rules do not contribute to the score.
  pass: 1,
};

const CONTEXT_DEV_BASE_URL = "https://api.context.dev/v1";

// ── Leaf helpers (no internal deps) ────────────────────────────────────

const round1 = (value: number): number => Math.round(value * 10) / 10;

const isObject = (value: unknown): value is JsonObject =>
  !!value && typeof value === "object" && !Array.isArray(value);

const decodeHtml = (value: string): string =>
  value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const normalizeWhitespace = (value: string): string =>
  value.replaceAll(/\s+/g, " ").trim();

const cjkRatio = (text: string): number => {
  const cjk = text.match(/[一-鿿㐀-䶿豈-￿぀-ゟ゠-ヿ가-힯]/g);
  return Math.min(text.length, 1)
    ? (cjk?.length ?? 0) / Math.max(text.length, 1)
    : 0;
};

const countSyllables = (word: string): number => {
  const cleaned = word.toLowerCase().replaceAll(/[^a-z]/g, "");
  if (!cleaned) {
    return 1;
  }
  const withoutSilentE = cleaned.replace(/e$/, "");
  const groups = withoutSilentE.match(/[aeiouy]+/g);
  return Math.max(groups?.length ?? 1, 1);
};

const stripScriptWrappers = (body: string): string => {
  let out = body.trim();
  out = out.replace(/^<!--/, "").replace(/-->$/, "");
  out = out.replace(/^\/\/\s*<!\[CDATA\[/, "").replace(/\/\/\s*\]\]>$/, "");
  out = out
    .replace(/^\/\*\s*<!\[CDATA\[\s*\*\//, "")
    .replace(/\/\*\s*\]\]>\s*\*\/$/, "");
  return out.trim();
};

const tryParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(decodeHtml(raw));
    } catch {
      return undefined;
    }
  }
};

const getAttr = (tag: string, attr: string): string | null => {
  const escaped = attr.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = tag.match(pattern);
  if (!match) {
    return null;
  }
  return decodeHtml(match[1] ?? match[2] ?? match[3] ?? "");
};

// ── Helpers with 1-level deps ──────────────────────────────────────────

const htmlToText = (html: string): string =>
  normalizeWhitespace(
    decodeHtml(
      html
        .replaceAll(/<script\b[\s\S]*?<\/script>/gi, " ")
        .replaceAll(/<style\b[\s\S]*?<\/style>/gi, " ")
        .replaceAll(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
        .replaceAll(/<[^>]+>/g, " ")
    )
  );

const fleschKincaidGrade = (text: string): number | null => {
  if (cjkRatio(text) > 0.35) {
    return null;
  }

  const words = text.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const sentences = text.match(/[.!?]+(?:\s|$)/g) ?? [];
  if (words.length < 80 || sentences.length < 3) {
    return null;
  }
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  return (
    0.39 * (words.length / sentences.length) +
    11.8 * (syllables / words.length) -
    15.59
  );
};

const hasSchemaType = (schema: JsonObject, types: string[]): boolean => {
  const raw = schema["@type"];
  const actual = Array.isArray(raw) ? raw : [raw];
  return actual.some(
    (type) => typeof type === "string" && types.includes(type)
  );
};

const flattenSchema = (value: unknown): JsonObject[] => {
  if (Array.isArray(value)) {
    return value.flatMap(flattenSchema);
  }
  if (!isObject(value)) {
    return [];
  }

  const objects = [value];
  const graph = value["@graph"];
  if (Array.isArray(graph)) {
    objects.push(...graph.filter(isObject));
  }
  return objects;
};

const extractTitle = (html: string): string | null => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(normalizeWhitespace(match[1])) : null;
};

const firstMarkdownHeading = (markdown: string): string | null => {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? normalizeWhitespace(match[1]) : null;
};

const extractMetaContent = (html: string, name: string): string | null => {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const tagName = getAttr(tag, "name") ?? getAttr(tag, "property");
    if (tagName?.toLowerCase() === name.toLowerCase()) {
      const content = getAttr(tag, "content");
      if (content) {
        return decodeHtml(content);
      }
    }
  }
  return null;
};

const extractCanonical = (html: string): string | null => {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const rel = getAttr(tag, "rel");
    if (rel?.toLowerCase().split(/\s+/).includes("canonical")) {
      return getAttr(tag, "href");
    }
  }
  return null;
};

const detectNoIndex = (html: string): boolean => {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags.some((tag) => {
    const name = getAttr(tag, "name") ?? getAttr(tag, "property");
    const content = getAttr(tag, "content") ?? "";
    return /robots|googlebot/i.test(name ?? "") && /\bnoindex\b/i.test(content);
  });
};

const extractLinks = (
  html: string,
  markdown: string,
  baseUrl: string
): string[] => {
  const raw = new Set<string>();
  const anchorTags = html.match(/<a\b[^>]*>/gi) ?? [];
  for (const tag of anchorTags) {
    const href = getAttr(tag, "href");
    if (href) {
      raw.add(href);
    }
  }
  for (const match of markdown.matchAll(
    /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/gi
  )) {
    raw.add(match[1]);
  }

  const links = new Set<string>();
  for (const href of raw) {
    try {
      const url = new URL(href, baseUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        url.hash = "";
        links.add(url.toString());
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return [...links];
};

const extractJsonLd = (
  html: string
): {
  schemas: JsonObject[];
  blockCount: number;
  parseFailures: number;
} => {
  const pattern =
    /<script\b[^>]*\btype\s*=\s*(?:"\s*application\/ld\+json\s*"|'\s*application\/ld\+json\s*'|application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [...html.matchAll(pattern)];

  const schemas: JsonObject[] = [];
  let parseFailures = 0;

  for (const block of blocks) {
    const raw = stripScriptWrappers(block[1]).trim();
    if (!raw) {
      continue;
    }
    const parsed = tryParseJson(raw);
    if (parsed === undefined) {
      parseFailures += 1;
      continue;
    }
    schemas.push(...flattenSchema(parsed));
  }

  return { blockCount: blocks.length, parseFailures, schemas };
};

const extractHeadings = (html: string, markdown: string): Heading[] => {
  const headings: Heading[] = [];
  for (const match of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    headings.push({ level: Number(match[1]), text: htmlToText(match[2]) });
  }
  for (const match of markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)) {
    headings.push({
      level: match[1].length,
      text: normalizeWhitespace(match[2]),
    });
  }

  const seen = new Set<string>();
  return headings.filter((h) => {
    const key = `${h.level}:${h.text.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return h.text.length > 0;
  });
};

const extractParagraphs = (text: string): string[] =>
  text
    .replaceAll(/```[\s\S]*?```/g, " ")
    .split(/\n{2,}/)
    .map((paragraph) =>
      normalizeWhitespace(
        paragraph
          .replaceAll(/^#{1,6}\s+/gm, "")
          .replaceAll(/^[-*]\s+/gm, "")
          .replaceAll(/\[[^\]]+\]\(([^)]+)\)/g, "$1")
      )
    )
    .filter((paragraph) => countWords(paragraph) >= 8);

const countDataPoints = (text: string): number => {
  const matches = text.match(
    /\b(?:19|20)\d{2}\b|\b\d+(?:\.\d+)?\s?%|\$\s?\d+(?:[,.]\d+)*|\b\d+(?:\.\d+)?x\b|\b\d+(?:,\d{3})+(?:\.\d+)?\b/g
  );
  return matches ? matches.length : 0;
};

const extractDateSignals = (
  html: string,
  text: string,
  schemas: JsonObject[]
): DateSignals => {
  const hasSchemaModified = schemas.some((s) => !!s.dateModified);
  const hasTimeTag = /<time\b[^>]*(datetime=|>)/i.test(html);
  const hasVisibleModified =
    /\b(updated|last updated|modified|last modified)\b.{0,40}\b(?:19|20)\d{2}\b/i.test(
      text
    );
  const hasAnyDate =
    hasSchemaModified ||
    hasTimeTag ||
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b/i.test(
      text
    ) ||
    /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/.test(text);

  return {
    evidence: `dateModified schema: ${hasSchemaModified ? "yes" : "no"}; visible modified date: ${hasVisibleModified ? "yes" : "no"}; time tag: ${hasTimeTag ? "yes" : "no"}.`,
    hasAnyDate,
    hasModifiedDate: hasSchemaModified || hasVisibleModified,
  };
};

const computeFaqStatus = (text: string, headings: Heading[]): AuditStatus => {
  const questionHeadings = headings.filter((h) => h.text.includes("?"));
  if (
    /\b(faq|frequently asked questions|questions and answers)\b/i.test(text)
  ) {
    return "pass";
  }
  if (questionHeadings.length >= 2) {
    return "pass";
  }
  if (questionHeadings.length === 1 || countMatches(text, /\?/g) >= 2) {
    return "partial";
  }
  return "fail";
};

const detectByline = (text: string, schema: SchemaSummary): boolean => {
  if (schema.hasPerson || schema.hasAuthor) {
    return true;
  }
  return /\b(by|written by|reviewed by|edited by)\s+[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3}\b/.test(
    text
  );
};

// ── Schema / scoring helpers ───────────────────────────────────────────

const summarizeSchema = (schemas: JsonObject[]): SchemaSummary => {
  const hasOrganization = schemas.some((s) =>
    hasSchemaType(s, ["Organization", "LocalBusiness", "Corporation"])
  );
  const organization = schemas.find((s) =>
    hasSchemaType(s, ["Organization", "LocalBusiness", "Corporation"])
  );

  let sameAsCount = 0;
  for (const s of schemas) {
    const { sameAs } = s;
    if (Array.isArray(sameAs)) {
      sameAsCount += sameAs.length;
    } else if (typeof sameAs === "string") {
      sameAsCount += 1;
    }
  }

  const organizationComplete = !!(
    organization &&
    organization.name &&
    organization.url &&
    organization.logo &&
    sameAsCount >= 1
  );

  const articles = schemas.filter((s) =>
    hasSchemaType(s, ["Article", "BlogPosting", "NewsArticle"])
  );
  const articleComplete = articles.some(
    (s) => s.headline && s.author && s.datePublished && s.dateModified
  );
  const hasPerson = schemas.some((s) => hasSchemaType(s, ["Person"]));
  const hasAuthor = schemas.some((s) => !!s.author);
  const hasFaq = schemas.some((s) => hasSchemaType(s, ["FAQPage"]));

  return {
    articleComplete,
    articleEvidence: articles.length
      ? `Article-like schema blocks: ${articles.length}; complete authorship/date fields: ${articleComplete ? "yes" : "no"}.`
      : "No Article or BlogPosting schema was found.",
    hasArticle: articles.length > 0,
    hasAuthor,
    hasFaq,
    hasOrganization,
    hasPerson,
    organizationComplete,
    organizationEvidence: hasOrganization
      ? `Organization-like schema found; complete core fields: ${organizationComplete ? "yes" : "no"}; sameAs links: ${sameAsCount}.`
      : "No Organization-like schema was found.",
    sameAsCount,
  };
};

const scoreBand = (score: number): AuditBand => {
  if (score <= 40) {
    return {
      interpretation:
        "The page is structurally hard for AI engines to fetch, parse, or trust.",
      label: "Critical",
    };
  }
  if (score <= 55) {
    return {
      interpretation:
        "Foundations are present in places, but the page is losing extractability and trust signals.",
      label: "Below average",
    };
  }
  if (score <= 70) {
    return {
      interpretation:
        "The page has reasonable AI SEO hygiene, with gaps in chunking, schema, or authority signals.",
      label: "Average",
    };
  }
  if (score <= 85) {
    return {
      interpretation:
        "The page is structured well enough to compete for AI citations on relevant prompts.",
      label: "Strong",
    };
  }
  return {
    interpretation:
      "The page exposes strong crawlability, structure, schema, and trust signals.",
    label: "Excellent",
  };
};

const scoreCategory = (
  category: CategoryDef,
  ctx: RuleContext
): AuditCategory => {
  const rules = RULES.filter((rule) => rule.categoryId === category.id);
  const evaluated = rules.map((rule) => ({ result: rule.evaluate(ctx), rule }));

  const applicable = evaluated.filter(({ result }) => result.status !== "na");
  const denominator = applicable.reduce(
    (sum, { rule }) => sum + (rule.multiplier ?? 1),
    0
  );

  const items: AuditItem[] = evaluated
    .map(({ rule, result }) => {
      if (result.status === "na") {
        return {
          evidence: result.evidence,
          id: rule.id,
          label: rule.label,
          maxScore: 0,
          recommendation: rule.recommendation,
          score: 0,
          status: result.status,
        };
      }
      const participates = denominator > 0;
      const itemMax = participates
        ? (category.maxScore * (rule.multiplier ?? 1)) / denominator
        : 0;
      return {
        evidence: result.evidence,
        id: rule.id,
        label: rule.label,
        maxScore: round1(itemMax),
        recommendation: rule.recommendation,
        score: round1(itemMax * STATUS_VALUE[result.status]),
        status: result.status,
      };
    })
    .toSorted((a, b) => b.maxScore - a.maxScore);

  return {
    description: category.description,
    id: category.id,
    items,
    maxScore: category.maxScore,
    naExcluded: evaluated.length - applicable.length,
    name: category.name,
    score: round1(items.reduce((sum, item) => sum + item.score, 0)),
  };
};

const scoreCategories = (ctx: RuleContext): AuditCategory[] =>
  CATEGORIES.map((category) => scoreCategory(category, ctx));

// ── context.dev fetchers ───────────────────────────────────────────────

const contextDevGet = async (
  apiKey: string,
  path: string,
  query: Record<string, string>
): Promise<JsonObject> => {
  const params = new URLSearchParams(query);
  const res = await fetch(
    `${CONTEXT_DEV_BASE_URL}${path}?${params.toString()}`,
    {
      headers: { authorization: `Bearer ${apiKey}` },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `context.dev ${path} failed (${res.status}): ${body.slice(0, 200)}`
    );
  }
  const json = (await res.json()) as JsonObject;
  return json;
};

const scrapeMarkdown = async (apiKey: string, url: string): Promise<string> => {
  const result = await contextDevGet(apiKey, "/web/scrape/markdown", {
    includeImages: "false",
    includeLinks: "true",
    url,
    useMainContentOnly: "true",
  });
  return typeof result.markdown === "string" ? result.markdown : "";
};

const scrapeHtml = async (apiKey: string, url: string): Promise<string> => {
  const result = await contextDevGet(apiKey, "/web/scrape/html", {
    url,
    waitForMs: "3000",
  });
  return typeof result.html === "string" ? result.html : "";
};

// ── Context builder ────────────────────────────────────────────────────

type InternalContext = RuleContext & {
  markdownStatus: "fulfilled" | "rejected";
  htmlStatus: "fulfilled" | "rejected";
};

const buildContext = async (
  normalizedUrl: string,
  contextDevApiKey: string
): Promise<InternalContext> => {
  const url = new URL(normalizedUrl);
  const host = displayHost(normalizedUrl);

  const [markdownSettled, htmlSettled] = await Promise.allSettled([
    scrapeMarkdown(contextDevApiKey, normalizedUrl),
    scrapeHtml(contextDevApiKey, normalizedUrl),
  ]);

  const markdown =
    markdownSettled.status === "fulfilled" ? markdownSettled.value : "";
  const html = htmlSettled.status === "fulfilled" ? htmlSettled.value : "";

  const htmlText = htmlToText(html);
  const analysisText = normalizeWhitespace(markdown || htmlText);
  const title = extractTitle(html) ?? firstMarkdownHeading(markdown);
  const description = extractMetaContent(html, "description");
  const links = extractLinks(html, markdown, normalizedUrl);
  const externalLinks = links.filter(
    (link) => new URL(link).origin !== url.origin
  );
  const sameOriginLinks = links.filter(
    (link) => new URL(link).origin === url.origin
  );
  const {
    schemas: jsonLd,
    blockCount: jsonLdBlockCount,
    parseFailures: jsonLdParseFailures,
  } = extractJsonLd(html);
  const schema = summarizeSchema(jsonLd);
  const headings = extractHeadings(html, markdown);
  const h1Count = Math.max(
    countMatches(html, /<h1\b/gi),
    headings.filter((h) => h.level === 1).length
  );
  const h2Count = Math.max(
    countMatches(html, /<h2\b/gi),
    headings.filter((h) => h.level === 2).length
  );
  const paragraphs = extractParagraphs(markdown || htmlText);
  const words = countWords(analysisText);
  const htmlWords = countWords(htmlText);
  const dataPoints = countDataPoints(analysisText);
  const grade = fleschKincaidGrade(analysisText);
  const dateSignals = extractDateSignals(html, analysisText, jsonLd);
  const canonical = extractCanonical(html);
  const hasNoIndex = detectNoIndex(html);
  const faqStatus = computeFaqStatus(analysisText, headings);
  const hasByline = detectByline(analysisText, schema);

  return {
    analysisText,
    canonical,
    dataPoints,
    dateSignals,
    description,
    externalLinks,
    faqStatus,
    grade,
    h1Count,
    h2Count,
    hasByline,
    hasNoIndex,
    headings,
    host,
    html,
    htmlStatus: htmlSettled.status,
    htmlText,
    htmlWords,
    jsonLd,
    jsonLdBlockCount,
    jsonLdParseFailures,
    links,
    markdown,
    markdownStatus: markdownSettled.status,
    paragraphs,
    sameOriginLinks,
    schema,
    title,
    url,
    words,
  };
};

// ── Public API ─────────────────────────────────────────────────────────

export const runAudit = async (
  normalizedUrl: string,
  contextDevApiKey: string
): Promise<AuditResult> => {
  const ctx = await buildContext(normalizedUrl, contextDevApiKey);
  const categories = scoreCategories(ctx);

  const score = round1(categories.reduce((sum, c) => sum + c.score, 0));
  const topPriorities = categories
    .flatMap((c) => c.items)
    .filter((item) => item.status === "fail" || item.status === "partial")
    .toSorted((a, b) => b.maxScore - a.maxScore)
    .slice(0, 5)
    .map((item) => `${item.id}: ${item.recommendation}`);

  let contextDevHtml: "failed" | "ready" | "empty";
  if (ctx.htmlStatus === "rejected") {
    contextDevHtml = "failed";
  } else if (ctx.html) {
    contextDevHtml = "ready";
  } else {
    contextDevHtml = "empty";
  }

  let contextDevMarkdown: "failed" | "ready" | "empty";
  if (ctx.markdownStatus === "rejected") {
    contextDevMarkdown = "failed";
  } else if (ctx.markdown) {
    contextDevMarkdown = "ready";
  } else {
    contextDevMarkdown = "empty";
  }

  const audit: Omit<AuditResult, "agentPrompts"> = {
    band: scoreBand(score),
    categories,
    description: ctx.description,
    diagnostics: {
      contextDevHtml,
      contextDevMarkdown,
      jsonLdParseFailures: ctx.jsonLdParseFailures,
    },
    fetchedAt: new Date().toISOString(),
    host: ctx.host,
    score,
    stats: {
      externalLinks: ctx.externalLinks.length,
      headings: ctx.headings.length,
      jsonLdBlocks: ctx.jsonLdBlockCount,
      links: ctx.links.length,
      markdownChars: ctx.markdown.length,
      rawHtmlChars: ctx.html.length,
      words: ctx.words,
    },
    title: ctx.title,
    topPriorities,
    url: normalizedUrl,
  };

  return { ...audit, agentPrompts: buildAgentFixPrompts(audit) };
};

export { CATEGORIES, RULES } from "./rules";
export type { Rule, RuleContext, CategoryDef } from "./rules";
