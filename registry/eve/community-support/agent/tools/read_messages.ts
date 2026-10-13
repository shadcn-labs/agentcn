import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description: 'Reads recent messages from a Discord channel via the Discord API.',
  inputSchema: z.object({
    channelId: z.string().describe('The Discord channel ID to read messages from'),
    limit: z.number().optional().default(50).describe('Number of messages to fetch'),
  }),
  async execute({ channelId, limit }) {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) {
      return { error: 'DISCORD_BOT_TOKEN environment variable is not set.' }
    }

    const url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    })

    if (!res.ok) {
      return { error: `Discord API returned ${res.status}: ${await res.text()}` }
    }

    const messages = (await res.json()) as {
      id: string
      content: string
      author: { username: string; id: string }
      timestamp: string
    }[]

    return {
      messages: messages.map((m) => ({
        id: m.id,
        author: m.author.username,
        content: m.content,
        timestamp: m.timestamp,
      })),
    }
  },
})
