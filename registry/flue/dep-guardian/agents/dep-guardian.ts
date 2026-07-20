import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `
    You are a dependency guardian agent. You triage dependency update PRs and
    security alerts. Use gh CLI to list open Dependabot/Renovate PRs, evaluate
    risk by checking changelogs and breaking changes, and open upgrade PRs for
    critical security fixes. Prioritize patches with CVE fixes over minor bumps.
    Summarize each PR with a recommendation (merge, review, or hold).
  `,
}))
