/** Live-preview composer for Extract DESIGN.md. */
import { deriveCssVariables, deriveTailwindTheme } from "./derive-tokens";
import type { LiveBrand, LiveStyleguide } from "./derive-tokens";
import { buildDesignMdPrompt, DESIGN_MD_SYSTEM } from "./prompt";

const CONTEXT_DEV_BASE_URL = "https://api.context.dev/v1";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DESIGN_MD_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000;

type Json = Record<string, unknown>;

const contextDevGet = async (
  apiKey: string,
  path: string,
  query: Record<string, string>
): Promise<Json> => {
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
  return (await res.json()) as Json;
};

const SIGNAL_TOOLS = [
  "extract_styleguide",
  "get_brand",
  "capture_screenshot",
  "fetch_markdown",
] as const;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export interface DesignMdSignals {
  styleguide: unknown;
  brand: unknown;
  screenshotUrl: string | null;
  markdown: string;
}

export interface ComposeHooks {
  onSignalStart?: (tool: string, input: Record<string, unknown>) => void;
  onSignalDone?: (tool: string) => void;
}

export const fetchDesignSignals = async (
  domain: string,
  contextDevApiKey: string,
  hooks?: ComposeHooks
): Promise<DesignMdSignals> => {
  for (const tool of SIGNAL_TOOLS) {
    hooks?.onSignalStart?.(tool, { domain });
  }

  const [styleguideRes, brandRes, screenshotRes, markdownRes] =
    await Promise.all([
      contextDevGet(contextDevApiKey, "/web/styleguide", {
        domain,
        timeoutMS: "120000",
      }),
      contextDevGet(contextDevApiKey, "/brand/retrieve", { domain }),
      contextDevGet(contextDevApiKey, "/web/screenshot", {
        domain,
        fullScreenshot: "false",
        handleCookiePopup: "true",
      }),
      contextDevGet(contextDevApiKey, "/web/scrape/markdown", {
        includeImages: "false",
        includeLinks: "true",
        url: `https://${domain}`,
        useMainContentOnly: "true",
      }),
    ]);

  for (const tool of SIGNAL_TOOLS) {
    hooks?.onSignalDone?.(tool);
  }

  return {
    brand: brandRes.brand ?? null,
    markdown: asString(markdownRes.markdown),
    screenshotUrl: asString(screenshotRes.screenshot) || null,
    styleguide: styleguideRes.styleguide ?? null,
  };
};

export const buildTokenArtifacts = (
  domain: string,
  signals: DesignMdSignals
): { tailwind: string; css: string } => {
  const styleguide = signals.styleguide as LiveStyleguide | null;
  const brand = (signals.brand as LiveBrand | null) ?? undefined;
  return {
    css: deriveCssVariables(domain, brand, styleguide),
    tailwind: deriveTailwindTheme(domain, brand, styleguide),
  };
};

export const generateDesignMd = async (
  domain: string,
  signals: DesignMdSignals,
  anthropicApiKey: string
): Promise<string> => {
  const prompt = buildDesignMdPrompt({
    contextStyleguide: signals.styleguide,
    domain,
    markdown: signals.markdown,
    screenshotUrl: signals.screenshotUrl ?? undefined,
  });

  const userContent = signals.screenshotUrl
    ? [
        {
          source: { type: "url", url: signals.screenshotUrl },
          type: "image",
        },
        { text: prompt, type: "text" },
      ]
    : [{ text: prompt, type: "text" }];

  const res = await fetch(ANTHROPIC_API_URL, {
    body: JSON.stringify({
      max_tokens: MAX_TOKENS,
      messages: [{ content: userContent, role: "user" }],
      model: DESIGN_MD_MODEL,
      system: DESIGN_MD_SYSTEM,
      temperature: 0.2,
    }),
    headers: {
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
      "x-api-key": anthropicApiKey,
    },
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Anthropic API error (${res.status}): ${body.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as {
    content: { text?: string; type: string }[];
  };
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();
};
