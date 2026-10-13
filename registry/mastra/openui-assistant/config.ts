import { agentConfig } from '@mastra/core/agent'
import { openuiAssistantWorkflow } from './workflows/openui-assistant'

export default agentConfig({
  model: 'openai/gpt-5.5',
  description: 'An OpenUI-powered assistant with real-time UI generation capabilities.',
  workflows: { openuiAssistantWorkflow },
})
