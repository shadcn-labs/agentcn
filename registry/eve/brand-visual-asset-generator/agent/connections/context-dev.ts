import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://context-dev.stlmcp.com",
  description:
    "Context.dev hosted MCP for resolving brand data, scraping webpages, crawling sites, and extracting styleguides from domains. Use it to gather brand colors, typography, logos, and product context before generating SVG assets.",
  headers: {
    "x-context-dev-api-key": readContextDevApiKey,
  },
  tools: {
    allow: ["search_docs", "execute"],
  },
});

function readContextDevApiKey(): string {
  const apiKey =
    process.env.CONTEXT_DEV_API_KEY?.trim() || process.env.CONTEXT_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing CONTEXT_DEV_API_KEY or CONTEXT_API_KEY for Context.dev MCP access.",
    );
  }

  return apiKey;
}
