import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an onboarding coach. Find users who are stuck before activation and
    draft nudge messages to help them progress. Analyze user behavior data from
    PostHog to identify drop-off points, then craft personalized messages that
    address specific friction points. Keep messages concise and action-oriented.
  `,
}))
