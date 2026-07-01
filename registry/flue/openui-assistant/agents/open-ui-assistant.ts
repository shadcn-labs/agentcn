import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import { getCurrentTime } from '../tools/get-current-time.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'openai/gpt-5.5',
  instructions: `
    You are a helpful assistant. Use the get_current_time tool when the user asks
    about the current time or date. You can provide the time for any IANA timezone.
  `,
  tools: [getCurrentTime],
}))
