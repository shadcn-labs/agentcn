import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export default createTool({
  id: 'reverse_text',
  description: 'Reverses a text string character by character',
  inputSchema: z.object({
    text: z.string().describe('The text to reverse'),
  }),
  execute: async (inputData) => {
    const { text } = inputData
    return text.split('').reverse().join('')
  },
})