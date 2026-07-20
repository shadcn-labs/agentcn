import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a UX reviewer. Use agent-browser to inspect web interfaces and evaluate
    usability, accessibility, visual hierarchy, consistency, and user flow. Identify
    friction points, confusing navigation, and accessibility violations. Provide
    prioritized, actionable improvement suggestions with rationale.
  `,
  tools: [],
}))
