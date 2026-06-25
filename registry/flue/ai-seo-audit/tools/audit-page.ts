import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import { runAudit } from '../lib/audit.ts'
import { normalizeAuditUrl } from '../lib/url.ts'

export const auditPage = defineTool({
  name: 'audit_page',
  description:
    'Runs the deterministic AI-SEO audit on a URL through context.dev and returns the full scored result: a 0–100 score and band, per-category check breakdowns (pass/partial/fail/na with evidence), top priorities, and ready-to-run agent fix prompts.',
  parameters: v.object({
    url: v.string(),
  }),
  execute: async ({ url }) => {
    const normalized = normalizeAuditUrl(url)
    if (!normalized) {
      return JSON.stringify({ error: `"${url}" is not a valid URL.` })
    }
    const audit = await runAudit(normalized, process.env.CONTEXT_DEV_API_KEY ?? '')
    return JSON.stringify(audit)
  },
})
