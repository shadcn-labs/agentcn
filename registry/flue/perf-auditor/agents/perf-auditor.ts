import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import { runPagespeed } from '../tools/run-pagespeed.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a performance auditor. Measure URL performance using PageSpeed Insights
    and identify issues that violate performance budgets. Analyze Core Web Vitals
    (LCP, INP, CLS), file GitHub issues for violations, and provide actionable
    recommendations for improvement.
  `,
  tools: [runPagespeed],
}))
