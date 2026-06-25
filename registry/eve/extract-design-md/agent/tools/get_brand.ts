import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { ContextDev } from 'context.dev'

const client = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY ?? '' })

export default defineTool({
  needsApproval: never(),
  description:
    'Retrieves brand assets for a domain — logos, backdrops, brand colors, slogan, and industry.',
  inputSchema: z.object({ domain: z.string() }),
  async execute({ domain }) {
    return await client.brand.retrieve({ domain })
  },
})
