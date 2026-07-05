import { agentConfig } from '@mastra/core/agent'

export default agentConfig({
  model: 'openai/gpt-5.2',
  description: 'Writes search queries for a research workflow.',
})
