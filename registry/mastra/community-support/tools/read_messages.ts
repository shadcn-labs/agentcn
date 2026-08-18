import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const readMessages = createTool({
  id: 'read-messages',
  description: 'Read recent messages from a Discord channel',
  inputSchema: z.object({
    channelId: z.string().describe('The Discord channel ID to read from'),
    limit: z.number().optional().default(50).describe('Number of messages to fetch'),
  }),
  outputSchema: z.object({
    messages: z.array(
      z.object({
        id: z.string(),
        author: z.string(),
        content: z.string(),
        timestamp: z.string(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { channelId, limit } = context
    // Implement Discord API call or use existing integration
    const messages = await fetchDiscordMessages(channelId, limit)
    return { messages }
  },
})

async function fetchDiscordMessages(channelId: string, limit: number) {
  // Placeholder: implement actual Discord API integration
  return []
}