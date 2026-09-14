import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a documentation sync agent. You keep documentation current with
    recently merged code. Use gh CLI to list merged PRs since the last docs
    update, identify changes that affect public APIs or user-facing behavior,
    and draft docs PRs with the necessary updates. Flag PRs that touch
    exported functions, CLI flags, or config schemas as high priority.
  `,
}))
