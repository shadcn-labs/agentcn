import { agentConfig } from '@mastra/core/agent'

export default agentConfig({
  model: 'openai/gpt-5.2',
  description: 'Evaluates research quality and completeness.',
})
