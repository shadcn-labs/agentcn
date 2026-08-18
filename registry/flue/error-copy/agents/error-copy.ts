import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an error copy agent. You surface user-facing error states and fix
    poor copy. Use agent-browser to navigate the app and identify vague, unhelpful,
    or inconsistent error messages. Open GitHub issues with specific file paths,
    current copy, and suggested replacements. Prioritize errors shown to unpaid
    users and onboarding flows.
  `,
}))
