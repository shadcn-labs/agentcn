import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import seoAudit from '../skills/seo-audit/SKILL.md' with { type: 'skill' }
import { fetchPage } from '../tools/fetch-page.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-sonnet-4-6',
  instructions: `
    You audit a web page for how readable it is to AI answer engines
    (ChatGPT, Claude, Perplexity) — not classic search ranking.
    Call fetch_page once to retrieve the page's Markdown and HTML, then follow
    the seo-audit skill: score the six categories to a 0–100 total, report a
    per-category breakdown, list the failing checks by impact, and end with an
    agent-ready fix prompt. Ground every finding in the fetched page only.
  `,
  skills: [seoAudit],
  tools: [fetchPage],
}))
