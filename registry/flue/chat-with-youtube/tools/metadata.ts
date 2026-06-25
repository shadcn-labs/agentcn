import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import { unlock, videoId } from '../lib/brightdata'

export const videoMetadata = defineTool({
  name: 'video_metadata',
  description: "Fetches a YouTube video's title, author, and id from its URL.",
  parameters: v.object({
    url: v.string(),
  }),
  execute: async ({ url }) => {
    const raw = await unlock(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    const meta = JSON.parse(raw) as { title?: string; author_name?: string }
    return JSON.stringify({ id: videoId(url), title: meta.title, author: meta.author_name })
  },
})
