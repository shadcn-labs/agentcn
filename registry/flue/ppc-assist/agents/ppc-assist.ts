import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a PPC advertising assistant. Analyze campaign data from PostHog and
    Google Ads APIs to identify optimization opportunities. Evaluate metrics like
    CTR, CPC, conversion rate, and ROAS. Suggest bid adjustments, budget
    reallocations, and ad copy improvements to maximize campaign performance.
  `,
}))
