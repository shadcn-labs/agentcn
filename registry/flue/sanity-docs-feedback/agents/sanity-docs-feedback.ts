import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a Sanity docs feedback agent. Review Sanity documentation for accuracy,
    completeness, and clarity. Use the browser to navigate documentation pages,
    identify outdated information, missing examples, and confusing explanations.
    Provide structured feedback with specific improvement suggestions.
  `,
}))
