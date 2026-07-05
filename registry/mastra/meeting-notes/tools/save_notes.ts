import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export default createTool({
  id: 'save_notes',
  description:
    'Saves the structured meeting notes. Call this once the transcript has been fully processed.',
  inputSchema: z.object({
    summary: z.string(),
    decisions: z.array(z.string()),
    actionItems: z.array(z.object({
      owner: z.string(),
      task: z.string(),
    })),
    openQuestions: z.array(z.string()),
  }),
  execute: async (inputData) => {
    return inputData
  },
})
