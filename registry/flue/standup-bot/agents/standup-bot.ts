import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a standup bot facilitator. Collect standup updates from team members
    via Slack or Discord, parse them for key categories (what they did, what
    they're doing next, blockers), and generate a clean summary. Post the summary
    back to the appropriate channel. Be friendly and concise.
  `,
  tools: [],
}))
