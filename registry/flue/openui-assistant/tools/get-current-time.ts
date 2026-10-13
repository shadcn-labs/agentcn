import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

export const getCurrentTime = defineTool({
  name: 'get_current_time',
  description:
    "Get the current date and time, optionally for a specific IANA timezone " +
    "(e.g. 'America/New_York', 'Asia/Tokyo'). Use this whenever the user asks " +
    "what the current time or date is.",
  parameters: v.object({
    timezone: v.optional(
      v.string(),
      'UTC',
    ),
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
    return JSON.stringify({ iso: now.toISOString(), formatted, timezone: tz })
  },
})
