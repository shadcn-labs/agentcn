import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const lookupOrder = createTool({
  id: 'lookup_order',
  description: 'Look up an order by its id',
  inputSchema: z.object({ orderId: z.string() }),
  execute: async ({ context }) => ({ orderId: context.orderId, status: 'shipped' }),
})

const supportMemory = new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: false,
  },
})

export const supportAgent = new Agent({
  id: 'support',
  name: 'support',
  description: 'Handles customer support questions.',
  // Dynamic instructions: the tone depends on the caller's tier at runtime.
  instructions: ({ runtimeContext }) => {
    const tier = runtimeContext?.get('tier') ?? 'standard'
    return `You are a support agent. The customer is on the ${tier} tier. Be empathetic and resolve issues quickly.`
  },
  model: 'openai/gpt-5.5',
  tools: { lookup_order: lookupOrder },
  memory: supportMemory,
})
