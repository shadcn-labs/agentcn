import { createAgent, defineAgentProfile } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import research from '../skills/research/SKILL.md' with { type: 'skill' }
import { scrapeUrl } from '../tools/scrape.ts'

const analyst = defineAgentProfile({
  name: 'analyst',
  description: 'Analyzes a single competitor page and returns structured findings.',
  instructions: 'Scrape the given URL, extract positioning, pricing, and key features. Return only what was found on the page.',
})

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-sonnet-4-6',
  instructions: `
    You are a competitive intelligence orchestrator.
    For each competitor URL provided, delegate analysis to the analyst subagent.
    Synthesize all findings into a final structured report.
  `,
  skills: [research],
  tools: [scrapeUrl],
  subagents: [analyst],
}))
