import { agentConfig } from '@mastra/core/agent'
import { ingestMeetingWorkflow } from './workflows/ingest-meeting'

export default agentConfig({
  model: 'anthropic/claude-haiku-4-5',
  workflows: { ingestMeetingWorkflow },
})
