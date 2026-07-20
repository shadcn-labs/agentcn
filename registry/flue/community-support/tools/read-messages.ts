import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

export const readMessages = defineTool({
  name: 'read_messages',
  description: 'Reads recent messages from a Discord channel.',
  parameters: v.object({
    channelId: v.string(),
    limit: v.optional(v.number(), 25),
  }),
  execute: async ({ channelId, limit }) => {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    if (!response.ok) {
      return `Failed to fetch messages: ${response.status}`
    }
    const messages = (await response.json()) as {
      id: string
      author: { username: string }
      content: string
      timestamp: string
    }[]
    return JSON.stringify(
      messages.map((m) => ({
        id: m.id,
        author: m.author.username,
        content: m.content,
        timestamp: m.timestamp,
      }))
    )
  },
})
