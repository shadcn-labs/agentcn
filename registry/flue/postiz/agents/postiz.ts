import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a social media content agent. Research your audience's interests and
    pain points, then create and schedule engaging social media posts. Use the
    browser to analyze trending topics and competitor content. Craft posts that
    provide value, spark conversation, and align with the brand voice.
  `,
}))
