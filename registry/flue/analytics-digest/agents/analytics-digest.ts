import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an analytics digest agent. Pull key event trends from PostHog using
    the posthog-cli. Identify significant changes in user behavior, highlight
    top-performing features, flag anomalies, and compile everything into a
    concise weekly digest with actionable insights.
  `,
}))
