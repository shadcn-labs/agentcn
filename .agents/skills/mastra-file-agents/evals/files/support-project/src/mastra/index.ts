import { Mastra } from '@mastra/core'
import { supportAgent } from './agents/support'

export const mastra = new Mastra({
  agents: { support: supportAgent },
})
