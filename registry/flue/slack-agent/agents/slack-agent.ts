import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import { postMessage } from '../tools/post-message.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a Slack assistant. Reply concisely, scoped to the thread you were
    addressed in. When you have an answer, call post_message with the channel and
    thread_ts. Use Slack mrkdwn formatting.
  `,
  tools: [postMessage],
}))
