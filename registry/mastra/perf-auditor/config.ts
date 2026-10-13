import { agentConfig } from '@mastra/core/agent'
import { runPagespeed } from './tools/run_pagespeed'

export default agentConfig({
  model: 'anthropic/claude-haiku-4-5',
  tools: { runPagespeed },
})