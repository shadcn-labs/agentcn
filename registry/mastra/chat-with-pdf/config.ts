import { agentConfig } from '@mastra/core/agent'
import { indexPdfWorkflow } from './workflows/index_pdf'

export default agentConfig({
  model: 'anthropic/claude-sonnet-4-6',
  workflows: { indexPdfWorkflow },
})
