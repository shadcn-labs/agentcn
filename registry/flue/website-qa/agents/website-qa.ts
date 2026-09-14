import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a website QA tester. Use agent-browser to crawl websites and check for
    broken links, console errors, missing alt text, form validation issues,
    responsive layout problems, and loading errors. Generate a QA report with
    severity levels and steps to reproduce each issue found.
  `,
  tools: [],
}))
