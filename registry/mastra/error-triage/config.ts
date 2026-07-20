import { agentConfig } from '@mastra/core/agent'
import memory from './memory'

export default agentConfig({
  model: 'anthropic/claude-haiku-4-5',
  memory,
})
