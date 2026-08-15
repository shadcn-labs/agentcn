import { findNeighbour } from "fumadocs-core/page-tree";
import type { InferPageType } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";

import { docs } from "@/.source/server";
import { ROUTES } from "@/constants/routes";
import { AGENT_DOCS_DIRECTIVE_MARKDOWN } from "@/lib/agent-discovery/directive";
import { docsContentRoute } from "@/lib/docs";

export const source = loader({
  baseUrl: ROUTES.DOCS,
  source: docs.toFumadocsSource(),
});

const EVE_AGENT_PREFIX = `${ROUTES.DOCS_AGENTS}/eve/`;
const FLUE_AGENT_PREFIX = `${ROUTES.DOCS_AGENTS}/flue/`;
const MASTRA_AGENT_PREFIX = `${ROUTES.DOCS_AGENTS}/mastra/`;
const LANGGRAPH_AGENT_PREFIX = `${ROUTES.DOCS_AGENTS}/langgraph/`;

/**
 * Previous/next neighbours for a docs page.
 *
 * The Agents sidebar lists the Eve recipes plus a base switcher, so the Flue,
 * Mastra, and LangGraph recipe pages are absent from the page tree and `findNeighbour`
 * returns nothing for them. For those pages we mirror the Eve neighbours,
 * rewriting Eve recipe URLs to their framework counterparts so the prev/next
 * controls match the Eve view.
 */
export const getDocNeighbours = (url: string) => {
  if (
    !url.startsWith(FLUE_AGENT_PREFIX) &&
    !url.startsWith(MASTRA_AGENT_PREFIX) &&
    !url.startsWith(LANGGRAPH_AGENT_PREFIX)
  ) {
    return findNeighbour(source.pageTree, url);
  }

  let targetPrefix = LANGGRAPH_AGENT_PREFIX;
  if (url.startsWith(FLUE_AGENT_PREFIX)) {
    targetPrefix = FLUE_AGENT_PREFIX;
  } else if (url.startsWith(MASTRA_AGENT_PREFIX)) {
    targetPrefix = MASTRA_AGENT_PREFIX;
  }

  const eve = findNeighbour(
    source.pageTree,
    url.replace(targetPrefix, EVE_AGENT_PREFIX)
  );

  const toTarget = <T extends { url: string }>(node: T | undefined) =>
    node?.url.startsWith(EVE_AGENT_PREFIX)
      ? { ...node, url: node.url.replace(EVE_AGENT_PREFIX, targetPrefix) }
      : node;

  return { next: toTarget(eve.next), previous: toTarget(eve.previous) };
};

export const getPageMarkdownUrl = (page: InferPageType<typeof source>) => {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join("/")}`,
  };
};

export const getLLMText = async (page: InferPageType<typeof source>) => {
  const processed = await page.data.getText("processed");

  const sections = [
    page.data.description,
    AGENT_DOCS_DIRECTIVE_MARKDOWN,
    processed,
  ].filter(Boolean);

  return `# ${page.data.title}

${sections.join("\n\n")}`;
};
