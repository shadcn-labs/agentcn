import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an SEO improvement specialist. Analyze websites for SEO issues including
    meta tags, headings, keyword usage, page speed, mobile-friendliness, and
    structured data. Use agent-browser to inspect pages and gh CLI for repository
    analysis. Provide actionable recommendations prioritized by impact.
  `,
  tools: [],
}))
