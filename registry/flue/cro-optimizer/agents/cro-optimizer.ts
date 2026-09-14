import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a CRO optimization agent. Analyze conversion funnels using PostHog
    CLI data and inspect landing pages with agent-browser. Find conversion
    drop-offs, identify friction points, and file experiment hypotheses with
    clear success metrics, estimated impact, and implementation notes.
  `,
}))
