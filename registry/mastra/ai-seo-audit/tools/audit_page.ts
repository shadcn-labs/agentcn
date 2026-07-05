import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { runAudit } from '../lib/audit'
import { normalizeAuditUrl } from '../lib/url'

export default createTool({
  id: 'audit_page',
  description:
    'Runs the deterministic AI-SEO audit on a URL through context.dev and returns the full scored result: a 0–100 score and band, per-category check breakdowns (pass/partial/fail/na with evidence), top priorities, and ready-to-run agent fix prompts.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  execute: async (inputData) => {
    const { url } = inputData
    const normalized = normalizeAuditUrl(url)
    if (!normalized) {
      return { error: `"${url}" is not a valid URL.` }
    }
    return await runAudit(normalized, process.env.CONTEXT_DEV_API_KEY ?? '')
  },
})
