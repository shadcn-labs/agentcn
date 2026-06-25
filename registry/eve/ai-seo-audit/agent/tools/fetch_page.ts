import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { ContextDev } from 'context.dev'

// context.dev fetches and renders the target page for us — we NEVER make a
// direct HTTP request to the audited site. All page data flows through the SDK.
// https://context.dev
const client = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY ?? '' })

export default defineTool({
  needsApproval: never(),
  description:
    'Fetches a URL through context.dev and returns both its main-content Markdown and rendered HTML for auditing.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const [markdown, html] = await Promise.all([
      client.web.webScrapeMd({
        url,
        includeLinks: true,
        includeImages: false,
        useMainContentOnly: true,
      }),
      client.web.webScrapeHTML({ url, waitForMs: 3000 }),
    ])

    return { url, markdown, html }
  },
})
