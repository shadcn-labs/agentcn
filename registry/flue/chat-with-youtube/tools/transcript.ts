import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import { extractJson, unlock, videoId } from '../lib/brightdata'

type PlayerResponse = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: { baseUrl: string; languageCode?: string }[]
    }
  }
}

type Json3 = {
  events?: { tStartMs?: number; segs?: { utf8?: string }[] }[]
}

export const getTranscript = defineTool({
  name: 'get_transcript',
  description:
    'Fetches the timestamped transcript of a YouTube video as an array of { text, seconds } segments.',
  parameters: v.object({
    url: v.string(),
  }),
  execute: async ({ url }) => {
    const html = await unlock(`https://www.youtube.com/watch?v=${videoId(url)}`)
    const player = extractJson<PlayerResponse>(html, 'ytInitialPlayerResponse')
    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!tracks?.length) {
      throw new Error('No transcript available for this video.')
    }
    const track = tracks.find((t) => t.languageCode?.startsWith('en')) ?? tracks[0]

    const raw = await unlock(`${track.baseUrl}&fmt=json3`)
    const data = JSON.parse(raw) as Json3
    return JSON.stringify(
      (data.events ?? [])
        .filter((e) => e.segs?.length)
        .map((e) => ({
          text: (e.segs ?? []).map((s) => s.utf8 ?? '').join(''),
          seconds: Math.floor((e.tStartMs ?? 0) / 1000),
        }))
    )
  },
})
