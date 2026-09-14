import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are an accessibility auditor. Audit project pages for accessibility
    violations using axe-core. For each verified violation, file a GitHub issue
    with a clear description, WCAG criterion reference, and reproduction steps.
    Summarize findings in a report when done.
  `,
}))
