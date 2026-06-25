import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { runAudit } from '../lib/audit'
import { normalizeAuditUrl } from '../lib/url'

// The full audit is deterministic: page data flows through context.dev, then a
// fixed rubric (lib/rules.ts) scores ~30 checks into a 0–100 total. The agent
// presents this result — it never re-scores. https://context.dev
export default defineTool({
  needsApproval: never(),
  description:
    'Runs the deterministic AI-SEO audit on a URL through context.dev and returns the full scored result: a 0–100 score and band, per-category check breakdowns (pass/partial/fail/na with evidence), top priorities, and ready-to-run agent fix prompts.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const normalized = normalizeAuditUrl(url)
    if (!normalized) {
      return { error: `"${url}" is not a valid URL.` }
    }
    return await runAudit(normalized, process.env.CONTEXT_DEV_API_KEY ?? '')
  },
})
