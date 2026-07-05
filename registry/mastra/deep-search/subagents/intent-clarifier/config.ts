import { agentConfig } from '@mastra/core/agent'

export default agentConfig({
  model: 'openai/gpt-5-mini',
  description: 'Analyzes user queries and generates clarifying questions to better understand intent.',
})
