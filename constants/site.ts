import { ROUTES } from "./routes";

export const FALLBACK_SITE_ORIGIN = "https://agentcn.vercel.app" as const;

const getBaseUrl = () => {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return process.env.SITE_URL ?? FALLBACK_SITE_ORIGIN;
};

const baseUrl = getBaseUrl();

export const SITE = {
  AUTHOR: {
    NAME: "Aniket Pawar",
    TWITTER: "@alaymanguy",
  },
  DESCRIPTION: {
    LONG: "A shadcn-style registry of complete AI agent recipes built on Eve, Flue, and Mastra. Copy, paste, ship production-ready agent patterns.",
    SHORT: "Production-ready agents, made simple",
  },
  KEYWORDS: [
    "ai agents",
    "agent registry",
    "eve framework",
    "flue framework",
    "mastra framework",
    "vercel eve",
    "shadcn registry",
    "npx shadcn add",
  ] as const,
  NAME: "agentcn",
  OG_IMAGE: `${baseUrl}/og.png`,
  REGISTRY: "@agentcn",
  URL: baseUrl,
};

export const META_THEME_COLORS = {
  dark: "#09090b",
  light: "#ffffff",
};

export const UTM_PARAMS = {
  utm_source: new URL(baseUrl).hostname,
};

export const TOP_LEVEL_SECTIONS = [
  { href: ROUTES.DOCS, name: "Introduction" },
  { href: ROUTES.DOCS_INSTALLATION, name: "Installation" },
  { href: ROUTES.DOCS_AGENTS, name: "Agents" },
  { href: ROUTES.DOCS_MCP, name: "MCP" },
  { href: ROUTES.DOCS_REGISTRY, name: "Registry" },
  { href: ROUTES.LLMS, name: "llms.txt" },
  { href: ROUTES.DOCS_CHANGELOG, name: "Changelog" },
];
