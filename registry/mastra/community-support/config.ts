import { agentConfig } from '@mastra/core/agent'
import { readMessages } from './tools/read_messages'

export default agentConfig({
  model: 'anthropic/claude-haiku-4-5',
  tools: { readMessages },
})