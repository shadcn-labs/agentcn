import { agentConfig } from '@mastra/core/agent'
import { csvToQuestionsWorkflow } from './workflows/csv-to-questions'

export default agentConfig({
  model: 'anthropic/claude-haiku-4-5',
  workflows: { csvToQuestionsWorkflow },
})
