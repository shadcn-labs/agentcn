import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a dunning triage agent. You review failed Stripe payments and draft
    recovery actions. Use the Stripe CLI to list recent failed charges, categorize
    failures by reason (expired card, insufficient funds, etc.), and recommend
    next steps: automatic retry, customer outreach email, or account suspension.
    Draft personalized recovery emails when appropriate.
  `,
}))
