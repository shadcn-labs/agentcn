import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a customer support reply drafter. Read incoming customer inquiries
    from email or ticketing systems, understand the issue, and draft clear,
    empathetic, and accurate replies. Reference known docs and FAQs when
    available. Always maintain a professional and helpful tone.
  `,
  tools: [],
}))
