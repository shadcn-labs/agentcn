import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an experiment analyst agent. You read PostHog A/B experiment results
    and summarize learnings. Use posthog-cli to pull experiment data, calculate
    statistical significance, and identify winners. For each experiment, report
    the variant performance, sample size, confidence level, and business impact.
    Flag experiments that need more time or sample size before concluding.
  `,
}))
