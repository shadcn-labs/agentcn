import { agentConfig } from '@mastra/core/agent'
import { deepSearch } from './workflows/deep-search'

export default agentConfig({
  model: 'openai/gpt-5.2',
  description: 'A deep search agent that researches questions by clarifying intent, planning queries, evaluating results, and synthesizing answers.',
  workflows: { deepSearch },
})
