/** AI-SEO audit rules, categories, and scoring helpers. */
import type { AuditStatus } from "./audit-types.ts";

export type RuleDependency =
  | "url"
  | "title"
  | "description"
  | "html"
  | "markdown"
  | "text"
  | "canonical"
  | "noindex-meta"
  | "links"
  | "json-ld"
  | "schema-summary"
  | "headings"
  | "paragraphs"
  | "data-points"
  | "date-signals"
  | "readability";

export type SchemaSummary = {
  hasOrganization: boolean;
  organizationComplete: boolean;
  organizationEvidence: string;
  hasArticle: boolean;
  articleComplete: boolean;
  articleEvidence: string;
  hasPerson: boolean;
  hasAuthor: boolean;
  hasFaq: boolean;
  sameAsCount: number;
};

export type DateSignals = {
  hasAnyDate: boolean;
  hasModifiedDate: boolean;
  evidence: string;
};

export type Heading = { level: number; text: string };

export type JsonObject = Record<string, unknown>;

export type RuleContext = {
  url: URL;
  host: string;

  title: string | null;
  description: string | null;
  canonical: string | null;
  hasNoIndex: boolean;

  html: string;
  htmlText: string;
  htmlWords: number;
  markdown: string;
  analysisText: string;
  words: number;

  paragraphs: string[];
  headings: Heading[];
  h1Count: number;
  h2Count: number;

  links: string[];
  externalLinks: string[];
  sameOriginLinks: string[];

  jsonLd: JsonObject[];
  jsonLdBlockCount: number;
  jsonLdParseFailures: number;
  schema: SchemaSummary;

  dataPoints: number;
  grade: number | null;
  dateSignals: DateSignals;

  faqStatus: AuditStatus;
  hasByline: boolean;
};

export type RuleEvaluation = {
  status: AuditStatus;
  evidence: string;
};

export type Rule = {
  id: string;
  categoryId: string;
  label: string;
  recommendation: string;
  dependencies: RuleDependency[];
  multiplier?: number;
  evaluate: (ctx: RuleContext) => RuleEvaluation;
};

export type CategoryDef = {
  id: string;
  name: string;
  description: string;
  maxScore: number;
};

export const CATEGORIES: CategoryDef[] = [
  {
    id: "A",
    name: "Technical AI Crawlability",
    description:
      "Can AI retrieval crawlers fetch and parse the page without JavaScript?",
    maxScore: 28.4,
  },
  {
    id: "B",
    name: "Content Structure & Chunking",
    description: "Can answer engines extract self-contained, quotable passages?",
    maxScore: 25.4,
  },
  {
    id: "C",
    name: "Structured Data / Schema",
    description:
      "Does the raw HTML expose machine-readable entities and page facts?",
    maxScore: 13.4,
  },
  {
    id: "D",
    name: "E-E-A-T & Entity Authority",
    description: "Does the page expose trust, authorship, and entity signals?",
    maxScore: 21.4,
  },
  {
    id: "E",
    name: "Off-site / Citation Surface Presence",
    description:
      "Does the page connect the brand to surfaces AI engines often cite?",
    maxScore: 8.4,
  },
  {
    id: "F",
    name: "Measurement & Governance",
    description: "Are monitoring and refresh signals visible or inferable?",
    maxScore: 3,
  },
];

export const RULES: Rule[] = [
  {
    id: "A1",
    categoryId: "A",
    label: "HTTPS is used for the audited URL.",
    recommendation:
      "Serve the page over HTTPS and redirect HTTP to HTTPS with a single 301.",
    dependencies: ["url"],
    evaluate: (ctx) => ({
      status: ctx.url.protocol === "https:" ? "pass" : "fail",
      evidence:
        ctx.url.protocol === "https:"
          ? "The submitted URL uses HTTPS."
          : "The submitted URL is not HTTPS.",
    }),
  },
  {
    id: "A8",
    categoryId: "A",
    label: "Critical content is present in the raw HTML response.",
    recommendation:
      "Render primary copy, headings, FAQs, and schema on the server. AI crawlers often do not execute client-side JavaScript.",
    dependencies: ["html", "text"],
    multiplier: 2,
    evaluate: (ctx) => {
      const htmlWords = ctx.htmlWords;
      const extracted = Math.max(ctx.words, 1);
      const ratio = htmlWords / extracted;
      const status: AuditStatus =
        htmlWords >= 250 && ratio >= 0.35
          ? "pass"
          : htmlWords >= 80
            ? "partial"
            : "fail";
      return {
        status,
        evidence: `${htmlWords} readable words were found in raw HTML; Context.dev extracted ${ctx.words} words from the page.`,
      };
    },
  },
  {
    id: "A11",
    categoryId: "A",
    label: "Canonical tag is present and points to an indexable URL.",
    recommendation:
      "Add a self-referencing canonical tag, or a deliberate canonical target for duplicate variants.",
    dependencies: ["canonical"],
    evaluate: (ctx) => ({
      status: ctx.canonical ? "pass" : "fail",
      evidence: ctx.canonical
        ? `Canonical URL: ${ctx.canonical}.`
        : "No canonical link tag was found in the raw HTML.",
    }),
  },
  {
    id: "A12",
    categoryId: "A",
    label: "No noindex directive was found.",
    recommendation:
      "Remove noindex from pages that should be eligible for AI search citation.",
    dependencies: ["noindex-meta"],
    evaluate: (ctx) => ({
      status: ctx.hasNoIndex ? "fail" : "pass",
      evidence: ctx.hasNoIndex
        ? "A robots noindex directive appears in the page HTML."
        : "No robots noindex directive was detected in the raw HTML.",
    }),
  },

  {
    id: "B1",
    categoryId: "B",
    label: "The page opens with a direct-answer BLUF intro naming the entity.",
    recommendation:
      "Start with a 2-3 sentence answer that names the brand, product, or topic and states what the page is about.",
    dependencies: ["paragraphs", "title", "url"],
    evaluate: (ctx) => {
      const first = firstUsefulParagraph(ctx.paragraphs);
      let status: AuditStatus = "fail";
      if (first) {
        const w = countWords(first);
        const tokens = [
          ctx.host.split(".")[0],
          ...(ctx.title ?? "")
            .split(/[\s|:.-]+/)
            .filter((t) => t.length > 3)
            .slice(0, 4),
        ].filter(Boolean);
        const namesEntity = tokens.some((t) =>
          new RegExp(`\\b${escapeRegExp(t)}\\b`, "i").test(first),
        );
        const answerPattern =
          /\b(is|are|helps|provides|offers|refers to|means|enables|builds|delivers)\b/i.test(
            first,
          );
        if (w >= 20 && w <= 90 && namesEntity && answerPattern) status = "pass";
        else if (w >= 12 && w <= 130 && (namesEntity || answerPattern))
          status = "partial";
      }
      return {
        status,
        evidence: first
          ? `First substantive paragraph: "${clip(first, 180)}"`
          : "No substantive opening paragraph was extracted.",
      };
    },
  },
  {
    id: "B2",
    categoryId: "B",
    label: "Heading hierarchy is clear with one H1 and topical H2 sections.",
    recommendation:
      "Use one H1, then H2/H3 boundaries for each answerable topic or sub-query.",
    dependencies: ["headings"],
    evaluate: (ctx) => {
      const status: AuditStatus =
        ctx.h1Count === 1 && ctx.h2Count >= 2
          ? "pass"
          : ctx.h1Count >= 1 && ctx.h2Count >= 1
            ? "partial"
            : "fail";
      return {
        status,
        evidence: `Detected ${ctx.h1Count} H1 heading(s), ${ctx.h2Count} H2 heading(s), and ${ctx.headings.length} total Markdown/HTML headings.`,
      };
    },
  },
  {
    id: "B3",
    categoryId: "B",
    label: "Paragraphs are short enough for passage retrieval.",
    recommendation:
      "Keep paragraphs to one idea each, usually 1-4 sentences and under roughly 120 words.",
    dependencies: ["paragraphs"],
    evaluate: (ctx) => {
      const paragraphs = ctx.paragraphs;
      const long = paragraphs.filter((p) => countWords(p) > 120).length;
      const veryLong = paragraphs.filter((p) => countWords(p) > 180).length;
      let status: AuditStatus = "fail";
      if (paragraphs.length) {
        if (veryLong === 0 && long / paragraphs.length <= 0.15) status = "pass";
        else if (veryLong <= 2 && long / paragraphs.length <= 0.35)
          status = "partial";
      }
      return {
        status,
        evidence: `${paragraphs.length} paragraph(s) found; ${long} exceed 120 words.`,
      };
    },
  },
  {
    id: "B4",
    categoryId: "B",
    label: "Sections are self-contained semantic chunks.",
    recommendation:
      "Break long pages into specific H2/H3 sections that can stand alone when retrieved as chunks.",
    dependencies: ["headings", "text"],
    evaluate: (ctx) => {
      const status: AuditStatus =
        ctx.h2Count >= 3 && ctx.words / Math.max(ctx.h2Count, 1) <= 450
          ? "pass"
          : ctx.h2Count >= 2
            ? "partial"
            : "fail";
      return {
        status,
        evidence: `${ctx.words} words across ${Math.max(ctx.h2Count, 1)} H2-level section(s).`,
      };
    },
  },
  {
    id: "B5",
    categoryId: "B",
    label: "FAQ or Q&A structure appears where appropriate.",
    recommendation:
      "Add a concise FAQ section for common prompt-style questions, especially on commercial and informational pages.",
    dependencies: ["text", "headings"],
    evaluate: (ctx) => ({
      status: ctx.faqStatus,
      evidence: `${countMatches(ctx.analysisText, /\?/g)} question mark(s) and ${ctx.headings.filter((h) => h.text.includes("?")).length} question-style heading(s) detected.`,
    }),
  },
  {
    id: "B6",
    categoryId: "B",
    label: "The page contains concrete data points.",
    recommendation:
      "Add dated statistics, named sources, percentages, benchmarks, prices, or other extractable facts.",
    dependencies: ["data-points"],
    evaluate: (ctx) => ({
      status:
        ctx.dataPoints >= 3 ? "pass" : ctx.dataPoints >= 1 ? "partial" : "fail",
      evidence: `${ctx.dataPoints} dated specifics, percentages, money values, multipliers, or named-entity-like data points were detected.`,
    }),
  },
  {
    id: "B7",
    categoryId: "B",
    label: "Quoted source or expert language is present.",
    recommendation:
      "Include at least one clearly attributed quote or sourced claim on long-form pages.",
    dependencies: ["markdown", "text"],
    evaluate: (ctx) => {
      const blockquote = /(^|\n)\s*>/.test(ctx.markdown);
      const accordingTo = /\baccording to\b/i.test(ctx.analysisText);
      const inlineQuote = /"[^"]{20,}"/.test(ctx.analysisText);
      const status: AuditStatus =
        blockquote || accordingTo ? "pass" : inlineQuote ? "partial" : "fail";
      return {
        status,
        evidence: blockquote
          ? "Markdown blockquote syntax was found."
          : accordingTo
            ? 'The phrase "according to" was found.'
            : "No obvious quotation or source-attribution pattern was found.",
      };
    },
  },
  {
    id: "B8",
    categoryId: "B",
    label: "External citations support major claims.",
    recommendation:
      "Link major factual claims to authoritative external sources so AI engines can cross-check them.",
    dependencies: ["links"],
    evaluate: (ctx) => ({
      status:
        ctx.externalLinks.length >= 3
          ? "pass"
          : ctx.externalLinks.length >= 1
            ? "partial"
            : "fail",
      evidence: `${ctx.externalLinks.length} external link(s) were detected.`,
    }),
  },
  {
    id: "B10",
    categoryId: "B",
    label: "Definitional sentence patterns are present.",
    recommendation:
      'Use patterns like "X is defined as..." or "X refers to..." for core concepts.',
    dependencies: ["text"],
    evaluate: (ctx) => {
      const found =
        /\b(is defined as|are defined as|refers to|means|is a|is an)\b/i.test(
          ctx.analysisText,
        );
      return {
        status: found ? "pass" : "fail",
        evidence: found
          ? "A definitional sentence pattern was detected."
          : "No clear definitional sentence pattern was detected.",
      };
    },
  },
  {
    id: "B11",
    categoryId: "B",
    label: "Internal links create sibling-page fan-out coverage.",
    recommendation:
      "Link to at least three related pages that cover adjacent questions, comparisons, use cases, or FAQs.",
    dependencies: ["links"],
    evaluate: (ctx) => ({
      status:
        ctx.sameOriginLinks.length >= 3
          ? "pass"
          : ctx.sameOriginLinks.length >= 1
            ? "partial"
            : "fail",
      evidence: `${ctx.sameOriginLinks.length} same-origin link(s) were detected in the page HTML or Markdown.`,
    }),
  },
  {
    id: "B12",
    categoryId: "B",
    label: "A visible or structured last-updated date exists.",
    recommendation:
      "Show a visible updated date and include dateModified in schema for pages that should be cited.",
    dependencies: ["date-signals", "url", "text"],
    evaluate: (ctx) => {
      if (!isArticleLike(ctx)) {
        return {
          status: "na",
          evidence:
            "This page does not look like an article or blog post, so a last-updated date is not required.",
        };
      }
      return {
        status: ctx.dateSignals.hasModifiedDate
          ? "pass"
          : ctx.dateSignals.hasAnyDate
            ? "partial"
            : "fail",
        evidence: ctx.dateSignals.evidence,
      };
    },
  },
  {
    id: "B13",
    categoryId: "B",
    label: "Readability is in a useful AI citation range.",
    recommendation:
      "Aim for clear expert prose: specific enough to be trusted, but not dense academic copy.",
    dependencies: ["readability"],
    evaluate: (ctx) => {
      const g = ctx.grade;
      const status: AuditStatus =
        g === null
          ? "partial"
          : g >= 10 && g <= 16
            ? "pass"
            : g >= 7 && g <= 20
              ? "partial"
              : "fail";
      return {
        status,
        evidence:
          g === null
            ? "Readability could not be estimated from the extracted text."
            : `Estimated Flesch-Kincaid grade level is ${g.toFixed(1)}.`,
      };
    },
  },
  {
    id: "B14",
    categoryId: "B",
    label: "Lists or tables make comparisons machine-extractable.",
    recommendation:
      "Use bullets, numbered lists, and tables for steps, comparisons, pros/cons, and factual summaries.",
    dependencies: ["markdown", "html"],
    evaluate: (ctx) => {
      const lists =
        countMatches(ctx.markdown, /^[-*]\s+/gm) +
        countMatches(ctx.html, /<li\b/gi);
      const tables =
        countMatches(ctx.markdown, /^\|.+\|$/gm) +
        countMatches(ctx.html, /<table\b/gi);
      const status: AuditStatus =
        tables >= 1 || lists >= 6 ? "pass" : lists >= 2 ? "partial" : "fail";
      return {
        status,
        evidence: `${lists} list item(s) and ${tables} table signal(s) detected.`,
      };
    },
  },

  {
    id: "C1",
    categoryId: "C",
    label: "JSON-LD structured data is present.",
    recommendation:
      "Add server-rendered JSON-LD. Start with WebPage, Organization, Article, Person, and FAQPage as applicable.",
    dependencies: ["json-ld"],
    evaluate: (ctx) => {
      const failureNote =
        ctx.jsonLdParseFailures > 0
          ? ` ${ctx.jsonLdParseFailures} block(s) were present but failed to parse; check for malformed JSON.`
          : "";
      return {
        status: ctx.jsonLd.length > 0 ? "pass" : "fail",
        evidence: `${ctx.jsonLd.length} JSON-LD entity(ies) parsed from ${ctx.jsonLdBlockCount} script block(s).${failureNote}`,
      };
    },
  },
  {
    id: "C2",
    categoryId: "C",
    label: "Organization schema includes name, URL, logo, and sameAs.",
    recommendation:
      "Add Organization schema with name, url, logo, and sameAs links to authoritative profiles.",
    dependencies: ["schema-summary"],
    evaluate: (ctx) => ({
      status: ctx.schema.organizationComplete
        ? "pass"
        : ctx.schema.hasOrganization
          ? "partial"
          : "fail",
      evidence: ctx.schema.organizationEvidence,
    }),
  },
  {
    id: "C3",
    categoryId: "C",
    label: "Article or BlogPosting schema includes authorship and dates.",
    recommendation:
      "For editorial pages, include Article or BlogPosting schema with headline, author, datePublished, and dateModified.",
    dependencies: ["schema-summary", "text", "url"],
    evaluate: (ctx) => {
      const status: AuditStatus = ctx.schema.articleComplete
        ? "pass"
        : ctx.schema.hasArticle
          ? "partial"
          : isArticleLike(ctx)
            ? "fail"
            : "na";
      return { status, evidence: ctx.schema.articleEvidence };
    },
  },
  {
    id: "C4",
    categoryId: "C",
    label: "Person schema supports visible authors.",
    recommendation:
      "Add Person schema for each author, including jobTitle, worksFor, credentials, and sameAs profiles.",
    dependencies: ["schema-summary", "text", "url"],
    evaluate: (ctx) => {
      if (!isArticleLike(ctx)) {
        return {
          status: "na",
          evidence:
            "This page does not look like an article or blog post, so Person schema is not required.",
        };
      }
      return {
        status: ctx.schema.hasPerson
          ? "pass"
          : ctx.hasByline
            ? "partial"
            : "fail",
        evidence: ctx.schema.hasPerson
          ? "Person schema was found."
          : ctx.hasByline
            ? "A byline was detected, but no Person schema was found."
            : "No Person schema or byline signal was found.",
      };
    },
  },
  {
    id: "C5",
    categoryId: "C",
    label: "FAQPage schema exists when Q&A content exists.",
    recommendation:
      "When FAQ content is visible, mirror the questions and answers in FAQPage JSON-LD.",
    dependencies: ["schema-summary", "text", "headings"],
    evaluate: (ctx) => ({
      status:
        ctx.faqStatus === "fail" ? "na" : ctx.schema.hasFaq ? "pass" : "fail",
      evidence: ctx.schema.hasFaq
        ? "FAQPage schema was found."
        : "FAQ-like content was found without FAQPage schema.",
    }),
  },
  {
    id: "C11",
    categoryId: "C",
    label: "Schema appears in the initial HTML response.",
    recommendation:
      "Do not rely on client-side JavaScript to inject important schema.",
    dependencies: ["json-ld"],
    evaluate: (ctx) => ({
      status: ctx.jsonLd.length > 0 ? "pass" : "fail",
      evidence:
        ctx.jsonLd.length > 0
          ? "JSON-LD was present in the raw HTML response."
          : "No JSON-LD was present in the raw HTML response.",
    }),
  },

  {
    id: "D5",
    categoryId: "D",
    label: "About, company, trust, or newsroom pages are linked.",
    recommendation:
      "Make About, Company, Trust, or Newsroom pages easy to reach from the audited page.",
    dependencies: ["links"],
    evaluate: (ctx) => {
      const pattern = /(about|company|trust|newsroom|press)/i;
      return {
        status: linkPathStatus(ctx.links, pattern),
        evidence: `${ctx.links.filter((l) => pattern.test(l)).length} about/trust/newsroom-style link(s) detected.`,
      };
    },
  },
  {
    id: "D6",
    categoryId: "D",
    label: "Privacy, terms, and contact information are linked.",
    recommendation:
      "Expose privacy policy, terms, contact, and support paths in the page chrome or footer.",
    dependencies: ["links"],
    evaluate: (ctx) => {
      const privacy = linkPathStatus(ctx.links, /(privacy)/i);
      const terms = linkPathStatus(ctx.links, /(terms|legal)/i);
      const contact = linkPathStatus(ctx.links, /(contact|support)/i);
      const combined = linkPathStatus(
        ctx.links,
        /(privacy|terms|legal|contact|support)/i,
      );
      const status: AuditStatus =
        privacy === "pass" && terms !== "fail" && contact !== "fail"
          ? "pass"
          : combined;
      return {
        status,
        evidence: `${ctx.links.filter((l) => /(privacy|terms|legal|contact|support)/i.test(l)).length} privacy/terms/contact-style link(s) detected.`,
      };
    },
  },
  {
    id: "D10",
    categoryId: "D",
    label: "Original research or proprietary data signals exist.",
    recommendation:
      "Publish original data, methodology, benchmarks, or named research that other sites can cite.",
    dependencies: ["text", "data-points"],
    multiplier: 1 / 3,
    evaluate: (ctx) => {
      const found =
        /\b(original research|study|survey|benchmark|dataset|methodology|proprietary data|we analyzed|we measured)\b/i.test(
          ctx.analysisText,
        );
      const status: AuditStatus = found
        ? "pass"
        : ctx.dataPoints >= 3
          ? "partial"
          : "fail";
      return {
        status,
        evidence: found
          ? "Research or methodology language was detected."
          : `${ctx.dataPoints} data point(s) were detected without strong original-research language.`,
      };
    },
  },
  {
    id: "D12",
    categoryId: "D",
    label: "Brand/entity descriptors are consistent.",
    recommendation:
      "Use the same brand name, category, and entity descriptors in title, meta description, headings, schema, and body copy.",
    dependencies: ["title", "description", "text"],
    evaluate: (ctx) => {
      const brand = ctx.host.split(".")[0];
      const titleHasBrand =
        !!ctx.title && new RegExp(escapeRegExp(brand), "i").test(ctx.title);
      const descHasBrand =
        !!ctx.description &&
        new RegExp(escapeRegExp(brand), "i").test(ctx.description);
      const bodyMentions = countMatches(
        ctx.analysisText,
        new RegExp(`\\b${escapeRegExp(brand)}\\b`, "gi"),
      );
      const status: AuditStatus =
        titleHasBrand && descHasBrand && bodyMentions >= 2
          ? "pass"
          : titleHasBrand || descHasBrand || bodyMentions >= 1
            ? "partial"
            : "fail";
      return {
        status,
        evidence: `Brand token "${brand}" appears in title: ${ctx.title ? "yes" : "no"}, meta description: ${ctx.description ? "yes" : "no"}, body mentions: ${bodyMentions}.`,
      };
    },
  },

  {
    id: "E1",
    categoryId: "E",
    label: "Review or marketplace citation surfaces are linked.",
    recommendation:
      "Link to maintained profiles on review or marketplace sites (G2, Capterra, Trustpilot, Gartner, ProductHunt) that match your category.",
    dependencies: ["links", "text", "json-ld"],
    multiplier: 0.5,
    evaluate: (ctx) => {
      const pattern =
        /(g2\.com|capterra\.com|trustpilot\.com|gartner\.com|producthunt\.com)/i;
      const count = ctx.externalLinks.filter((l) => pattern.test(l)).length;
      if (count > 0) {
        return {
          status: "pass",
          evidence: `${count} review/marketplace link(s) detected.`,
        };
      }
      if (!isCommercialOfferingLike(ctx)) {
        return {
          status: "na",
          evidence:
            "This page does not look like a commercial product or SaaS offering, so review/marketplace profiles are not expected.",
        };
      }
      return {
        status: "fail",
        evidence:
          "Page reads as a commercial product/SaaS offering, but no review or marketplace profile link was detected.",
      };
    },
  },
  {
    id: "E7",
    categoryId: "E",
    label: "GitHub or developer surface is linked when relevant.",
    recommendation:
      "For technical products, link active GitHub repositories, examples, or developer docs.",
    dependencies: ["links", "text", "json-ld", "url"],
    evaluate: (ctx) => {
      const found = /github\.com/i.test(ctx.externalLinks.join(" "));
      if (found) {
        return { status: "pass", evidence: "A GitHub link was detected." };
      }
      if (!isTechnicalProductLike(ctx)) {
        return {
          status: "na",
          evidence:
            "This page does not look like a technical or developer product, so a GitHub surface is not expected.",
        };
      }
      return {
        status: "fail",
        evidence:
          "Page reads as a developer/technical product, but no GitHub link was detected.",
      };
    },
  },
  {
    id: "E10",
    categoryId: "E",
    label: "Entity disambiguation is supported by sameAs links.",
    recommendation:
      "Use sameAs links to Wikidata, LinkedIn, Crunchbase, Wikipedia, GitHub, or other authoritative profiles on Organization or Person schema.",
    dependencies: ["schema-summary"],
    evaluate: (ctx) => {
      if (!hasDisambiguableEntity(ctx)) {
        return {
          status: "na",
          evidence:
            "No Organization, Person, or Article entity was found on this page to attach sameAs links to.",
        };
      }
      return {
        status:
          ctx.schema.sameAsCount >= 3
            ? "pass"
            : ctx.schema.sameAsCount >= 1
              ? "partial"
              : "fail",
        evidence: `${ctx.schema.sameAsCount} sameAs link(s) were found in JSON-LD.`,
      };
    },
  },
  {
    id: "E12",
    categoryId: "E",
    label: "Outbound citations place the entity near named category sources.",
    recommendation:
      "Cite and co-occur with authoritative category sources, benchmarks, standards, and named experts.",
    dependencies: ["links", "data-points"],
    evaluate: (ctx) => ({
      status:
        ctx.externalLinks.length >= 5 && ctx.dataPoints >= 3
          ? "pass"
          : ctx.externalLinks.length >= 2
            ? "partial"
            : "fail",
      evidence: `${ctx.externalLinks.length} external link(s) and ${ctx.dataPoints} data point(s) were detected.`,
    }),
  },

  {
    id: "F6",
    categoryId: "F",
    label: "A content refresh signal is visible.",
    recommendation:
      "Publish visible updated dates and refresh important pages quarterly.",
    dependencies: ["date-signals", "url", "text"],
    evaluate: (ctx) => {
      if (!isArticleLike(ctx)) {
        return {
          status: "na",
          evidence:
            "This page does not look like an article or blog post, so a refresh-date signal is not required.",
        };
      }
      return {
        status: ctx.dateSignals.hasModifiedDate
          ? "pass"
          : ctx.dateSignals.hasAnyDate
            ? "partial"
            : "fail",
        evidence: ctx.dateSignals.evidence,
      };
    },
  },
];

export function countWords(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
      let count = 0;
      for (const segment of segmenter.segment(text)) {
        if (segment.isWordLike) count++;
      }
      return count;
    } catch {
    }
  }

  const latin =
    text.match(/[A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ'-]*/g) ?? [];
  const cjk = text.match(
    /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯]/g,
  );
  return latin.length + (cjk?.length ?? 0);
}

export function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clip(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}...`;
}

function firstUsefulParagraph(paragraphs: string[]): string {
  return paragraphs.find((p) => countWords(p) >= 12) ?? "";
}

function isArticleLike(ctx: RuleContext): boolean {
  return (
    /\/(blog|article|articles|guide|guides|news|post|posts|insight|insights|research)\//i.test(
      ctx.url.pathname,
    ) || ctx.schema.hasArticle
  );
}

function isCommercialOfferingLike(ctx: RuleContext): boolean {
  if (isArticleLike(ctx)) return false;
  if (
    hasJsonLdType(ctx, [
      "Product",
      "SoftwareApplication",
      "WebApplication",
      "MobileApplication",
      "Service",
      "Offer",
    ])
  ) {
    return true;
  }
  return /\b(pricing|free trial|start free|sign up|signup|sign-up|get started|request a demo|schedule a demo|book a demo|buy now|add to cart|subscribe|per (?:month|user|seat)|saas|platform|software)\b/i.test(
    ctx.analysisText,
  );
}

function isTechnicalProductLike(ctx: RuleContext): boolean {
  if (
    hasJsonLdType(ctx, [
      "SoftwareApplication",
      "SoftwareSourceCode",
      "APIReference",
    ])
  ) {
    return true;
  }
  if (/\/(docs?|api|sdk|reference|developers?)(\/|$)/i.test(ctx.url.pathname)) {
    return true;
  }
  return /\b(api|sdk|cli|library|framework|open[- ]source|developer (?:portal|docs|guide)|npm install|pip install|brew install|github\.com\/[^\s]+)\b/i.test(
    ctx.analysisText,
  );
}

function hasDisambiguableEntity(ctx: RuleContext): boolean {
  return (
    ctx.schema.hasOrganization || ctx.schema.hasPerson || ctx.schema.hasArticle
  );
}

function hasJsonLdType(ctx: RuleContext, types: string[]): boolean {
  return ctx.jsonLd.some((obj) => {
    const raw = obj["@type"];
    const actual = Array.isArray(raw) ? raw : [raw];
    return actual.some(
      (type) => typeof type === "string" && types.includes(type),
    );
  });
}

function linkPathStatus(links: string[], pattern: RegExp): AuditStatus {
  const count = links.filter((l) => pattern.test(l)).length;
  if (count >= 2) return "pass";
  if (count === 1) return "partial";
  return "fail";
}

export const RULES_BY_ID: Record<string, Rule> = Object.fromEntries(
  RULES.map((rule) => [rule.id, rule]),
);

export const CATEGORIES_BY_ID: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);
