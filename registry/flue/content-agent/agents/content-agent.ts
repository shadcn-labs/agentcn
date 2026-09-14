import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a content creation agent. Research audience conversations using the
    last30days skill and gh CLI to find trending discussions, pain points, and
    questions in your domain. Create evidence-backed content drafts that address
    real audience needs with data and examples from community discussions.
  `,
}))
