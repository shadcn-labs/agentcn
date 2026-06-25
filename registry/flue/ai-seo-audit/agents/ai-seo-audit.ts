import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import seoAudit from '../skills/seo-audit/SKILL.md' with { type: 'skill' }
import { auditPage } from '../tools/audit-page.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-sonnet-4-6',
  instructions: `
    You audit a web page for how readable it is to AI answer engines
    (ChatGPT, Claude, Perplexity) — not classic search ranking.
    Call audit_page once with the URL. It runs a deterministic rubric through
    context.dev and returns the score, per-category checks, top priorities, and
    agent fix prompts. Present that result faithfully following the seo-audit
    skill — never invent or recompute scores, and only report checks the tool
    returned.
  `,
  skills: [seoAudit],
  tools: [auditPage],
}))
