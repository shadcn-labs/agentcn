import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a competitor analysis agent. Watch competitor pages for material
    changes using agent-browser. Track pricing updates, feature launches,
    messaging shifts, and design changes. When a significant change is detected,
    send a concise alert to Slack with a summary of what changed and its
    strategic implications.
  `,
}))
