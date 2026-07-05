import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const ZOOM_API = 'https://api.zoom.us/v2'

const headers = () => ({
  Authorization: `Bearer ${process.env.ZOOM_JWT_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
})

export default createTool({
  id: 'get_transcript',
  description: 'Gets the transcript for a specific Zoom meeting.',
  inputSchema: z.object({
    meetingId: z.string().describe('Zoom meeting ID'),
  }),
  outputSchema: z.object({
    transcript: z.array(
      z.object({
        speaker: z.string(),
        timestamp: z.string(),
        text: z.string(),
      }),
    ),
  }),
  execute: async (inputData) => {
    const { meetingId } = inputData
    const url = `${ZOOM_API}/meetings/${meetingId}/recordings`
    const data = await fetch(url, { headers: headers() }).then((r) =>
      r.json(),
    )
    const recording = ((data.recording_files ?? []) as any[]).find(
      (r: any) => r.recording_type === 'audio_transcript',
    )
    if (!recording?.download_url) {
      return { transcript: [] }
    }
    const transcriptText = await fetch(
      `${recording.download_url}?access_token=${process.env.ZOOM_JWT_TOKEN ?? ''}`,
    ).then((r) => r.text())
    const lines = transcriptText.split('\n').filter(Boolean)
    return {
      transcript: lines.map((line) => {
        const match = line.match(
          /^(.+?)\s*\((\d{2}:\d{2}:\d{2})\)\s*(.+)$/,
        )
        if (!match) return { speaker: 'Unknown', timestamp: '', text: line }
        return {
          speaker: match[1].trim(),
          timestamp: match[2],
          text: match[3].trim(),
        }
      }),
    }
  },
})
