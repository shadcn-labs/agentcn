import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a backlink prospecting agent. Use the DataForSEO MCP connection to
    find backlink opportunities where competitors have links but this project
    doesn't. Analyze domain authority, relevance, and outreach potential.
    Prioritize opportunities by impact and produce a ranked prospecting report
    with contact information where available.
  `,
}))
