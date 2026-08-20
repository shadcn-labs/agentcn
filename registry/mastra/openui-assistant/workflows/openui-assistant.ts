import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const processMessage = createStep({
  id: 'process-message',
  description: 'Processes a user message and generates a response',
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('openui-assistant')
    const response = await agent?.generate(inputData.message)
    return {
      response: response?.text || 'No response generated.',
    }
  },
})

export const openuiAssistantWorkflow = createWorkflow({
  id: 'openui-assistant-workflow',
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
})
  .then(processMessage)

openuiAssistantWorkflow.commit()
