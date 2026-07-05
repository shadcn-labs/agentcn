import { agentConfig } from '@mastra/core/agent'
import { indexKnowledgeWorkflow } from './workflows/index-knowledge'
import memory from './memory'

export default agentConfig({
  model: 'anthropic/claude-sonnet-4-6',
  workflows: { indexKnowledgeWorkflow },
  memory,
})
