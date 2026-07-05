import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const fetchTranscript = createStep({
  id: 'fetch-transcript',
  description: 'Fetches transcript from Zoom for a given meeting',
  inputSchema: z.object({
    meetingId: z.string(),
  }),
  outputSchema: z.object({
    meetingId: z.string(),
    transcript: z.array(
      z.object({
        speaker: z.string(),
        timestamp: z.string(),
        text: z.string(),
      }),
    ),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('meetingNotesAgent')
    const response = await agent?.generate(
      `Fetch the transcript for Zoom meeting ${inputData.meetingId} using the get_transcript tool.`,
    )
    const data = JSON.parse(response?.text || '{"transcript":[]}')
    return {
      meetingId: inputData.meetingId,
      transcript: data.transcript ?? [],
    }
  },
})

const summarizeMeeting = createStep({
  id: 'summarize-meeting',
  description: 'Uses agent to create a structured summary from the transcript',
  inputSchema: z.object({
    meetingId: z.string(),
    transcript: z.array(
      z.object({
        speaker: z.string(),
        timestamp: z.string(),
        text: z.string(),
      }),
    ),
  }),
  outputSchema: z.object({
    meetingId: z.string(),
    summary: z.string(),
    decisions: z.array(z.string()),
    actionItems: z.array(
      z.object({
        owner: z.string(),
        task: z.string(),
      }),
    ),
    openQuestions: z.array(z.string()),
  }),
  execute: async ({ inputData, mastra }) => {
    const transcriptText = inputData.transcript
      .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join('\n')

    const agent = mastra?.getAgent('meetingNotesAgent')
    const response = await agent?.generate(
      `Analyze the following meeting transcript and produce a structured summary.

Transcript:
${transcriptText}

Return ONLY a JSON object with this exact format (no markdown, no explanation):
{
  "summary": "Brief overview of the meeting",
  "decisions": ["Decision 1", "Decision 2"],
  "actionItems": [{"owner": "Person", "task": "What to do"}],
  "openQuestions": ["Question 1", "Question 2"]
}`,
    )

    const text = response?.text || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return {
      meetingId: inputData.meetingId,
      summary: result.summary ?? '',
      decisions: result.decisions ?? [],
      actionItems: result.actionItems ?? [],
      openQuestions: result.openQuestions ?? [],
    }
  },
})

export const ingestMeetingWorkflow = createWorkflow({
  id: 'ingest-meeting-workflow',
  inputSchema: z.object({
    meetingId: z.string(),
  }),
  outputSchema: z.object({
    meetingId: z.string(),
    summary: z.string(),
    decisions: z.array(z.string()),
    actionItems: z.array(
      z.object({
        owner: z.string(),
        task: z.string(),
      }),
    ),
    openQuestions: z.array(z.string()),
  }),
})
  .then(fetchTranscript)
  .then(summarizeMeeting)

ingestMeetingWorkflow.commit()
