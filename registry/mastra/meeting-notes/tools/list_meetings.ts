import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const ZOOM_API = 'https://api.zoom.us/v2'

const headers = () => ({
  Authorization: `Bearer ${process.env.ZOOM_JWT_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
})

export default createTool({
  id: 'list_meetings',
  description: 'Lists recent Zoom meetings for the authenticated user.',
  inputSchema: z.object({
    userId: z
      .string()
      .optional()
      .describe('Zoom user ID (defaults to "me")'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(300)
      .optional()
      .describe('Maximum number of meetings to return'),
  }),
  outputSchema: z.object({
    meetings: z.array(
      z.object({
        id: z.string(),
        topic: z.string(),
        startTime: z.string(),
        duration: z.number(),
      }),
    ),
  }),
  execute: async (inputData) => {
    const { userId = 'me', limit = 30 } = inputData
    const url = new URL(`${ZOOM_API}/users/${userId}/meetings`)
    url.searchParams.set('type', 'scheduled')
    url.searchParams.set('page_size', String(Math.min(limit, 300)))
    const data = await fetch(url.toString(), { headers: headers() }).then(
      (r) => r.json(),
    )
    return {
      meetings: ((data.meetings ?? []) as any[]).map((m) => ({
        id: String(m.id),
        topic: m.topic as string,
        startTime: m.start_time as string,
        duration: m.duration as number,
      })),
    }
  },
})
