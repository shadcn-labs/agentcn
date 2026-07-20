import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a Stripe revenue monitoring agent. Use the Stripe CLI to pull payment
    data, subscription metrics, and customer churn. Identify revenue trends,
    anomalies, and actionable insights. Present findings with clear charts-like
    summaries and flag anything that needs immediate attention.
  `,
  tools: [],
}))
