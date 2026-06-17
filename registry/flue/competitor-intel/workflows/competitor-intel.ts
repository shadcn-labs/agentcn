import { createAgent, defineAgentProfile, type FlueContext } from '@flue/runtime'
import * as v from 'valibot'
import research from '../skills/research/SKILL.md' with { type: 'skill' }
import { scrapeUrl } from '../tools/scrape.ts'

const analyst = defineAgentProfile({
  name: 'analyst',
  description: 'Analyzes a single competitor page.',
  instructions: 'Scrape the URL, extract positioning, priciand key features.',
})

const orchestrator = createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  skills: [research],
  tools: [scrapeUrl],
  subagents: [analyst],
}))

const Report = v.object({
  competitors: v.array(v.object({
    url: v.string(),
    positioning: v.string(),
    pricing: v.string(),
    keyFeatures: v.array(v.string()),
  })),
  summary: v.string(),
})

export async function run({ init, payload }: FlueContext<{ urls: string[] }>) {
  const harness = await init(orchestrator)
  const session = await harness.session()

  const response = await session.prompt(
    `Analyze these competitors: ${payload.urls.join(', ')}`,
    { result: Report }
  )

  return response.data
}
