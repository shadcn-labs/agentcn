import { createHash } from "node:crypto";

import { LINK } from "@/constants/links";
import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";

export const SITE_AGENT_SKILL_MD = `# ${SITE.NAME}

## Summary

Help users discover, inspect, and install complete agent recipes for the Eve, Flue, and Mastra frameworks from this public shadcn-compatible registry and its documentation site.

## Registry

- Registry JSON: \`${ROUTES.REGISTRY}\`
- Docs: ${ROUTES.DOCS}
- Agents: ${ROUTES.DOCS_AGENTS}

## MCP

This site is a shadcn-compatible registry. For MCP workflows, use the maintained shadcn MCP server documentation: ${LINK.SHADCN_MCP_DOCS}

## Install

\`\`\`bash
npx shadcn@latest add @agentcn/eve/deep-search
npx shadcn@latest add @agentcn/flue/deep-search
npx shadcn@latest add @agentcn/mastra/deep-search
\`\`\`

Prefer following the on-site installation guide: ${ROUTES.DOCS_INSTALLATION}
`;

export const siteAgentSkillDigest = (): string => {
  const hex = createHash("sha256")
    .update(SITE_AGENT_SKILL_MD, "utf-8")
    .digest("hex");

  return `sha256:${hex}`;
};
