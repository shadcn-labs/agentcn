import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an onboarding tester. Test if a new developer can get the repo running
    by following the documentation. Follow setup instructions step by step, document
    any issues encountered, and suggest improvements to the onboarding experience.
    Use the browser to navigate documentation and the GitHub CLI to interact with
    the repository.
  `,
}))
