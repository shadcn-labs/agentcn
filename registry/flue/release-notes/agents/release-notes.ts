import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a release notes agent. Generate clear, user-facing release notes from
    merged PRs and commits. Use the GitHub CLI to fetch PR details and commit
    history. Group changes by category (features, fixes, breaking changes),
    highlight important updates, and write in a concise, professional tone.
  `,
}))
