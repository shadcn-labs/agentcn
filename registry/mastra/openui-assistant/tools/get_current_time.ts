import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export default createTool({
  id: 'get_current_time',
  description:
    "Get the current date and time, optionally for a specific IANA timezone " +
    "(e.g. 'America/New_York', 'Asia/Tokyo'). Use this whenever the user asks " +
    "what the current time or date is.",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe("IANA timezone name such as 'Asia/Kolkata'. Defaults to UTC."),
  }),
  outputSchema: z.object({
    iso: z.string(),
    formatted: z.string(),
    timezone: z.string(),
  }),
  execute: async ({ timezone }) => {
    const now = new Date()
    let tz = timezone?.trim() || 'UTC'
    let formatted: string
    try {
      formatted = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: tz,
      }).format(now)
    } catch {
      tz = 'UTC'
      formatted = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: tz,
      }).format(now)
    }
    return { iso: now.toISOString(), formatted, timezone: tz }
  },
})
