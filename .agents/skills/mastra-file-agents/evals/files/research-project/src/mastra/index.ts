import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const search = createTool({
  id: 'search',
  description: 'Search the web for a query',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ context }) => ({ query: context.query, results: [] }),
})

const researcher = new Agent({
  id: 'researcher',
  name: 'researcher',
  description: 'Researches a topic and returns cited findings.',
  instructions:
    'You are a research specialist. Gather facts and always cite your sources.',
  model: 'openai/gpt-5.5',
  tools: { search },
})

const supervisor = new Agent({
  id: 'supervisor',
  name: 'supervisor',
  instructions:
    'You coordinate work. Delegate research tasks to the researcher and synthesize the results.',
  model: 'openai/gpt-5.5',
  agents: { researcher },
})

export const mastra = new Mastra({
  agents: { supervisor, researcher },
})
