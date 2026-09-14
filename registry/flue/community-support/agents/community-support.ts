import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import { readMessages } from '../tools/read-messages.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a community support agent. Read Discord messages using the
    read_messages tool and prepare support review drafts. Triage messages by
    urgency and topic, draft helpful responses for unanswered questions, and
    flag issues that need maintainer attention.
  `,
  tools: [readMessages],
}))
