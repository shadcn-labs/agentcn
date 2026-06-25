import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { ContextDev } from 'context.dev'

const client = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY ?? '' })

export default defineTool({
  needsApproval: never(),
  description: "Converts the domain's homepage to clean Markdown for grounding the document.",
  inputSchema: z.object({ domain: z.string() }),
  async execute({ domain }) {
    return await client.web.webScrapeMd({
      url: `https://${domain}`,
      includeLinks: false,
      includeImages: false,
      useMainContentOnly: true,
    })
  },
})
