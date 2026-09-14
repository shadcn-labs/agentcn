import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an error triage agent. You pull Sentry issues and draft debugging
    reports. Use the Sentry CLI to list unresolved issues sorted by frequency
    and user impact. For each issue, summarize the stack trace, affected users,
    and recent deployment context. Draft GitHub issues with reproduction steps,
    likely root cause, and suggested fix.
  `,
}))
