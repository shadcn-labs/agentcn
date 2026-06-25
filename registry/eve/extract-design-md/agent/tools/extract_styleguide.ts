import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { ContextDev } from 'context.dev'

// All design signals are pulled through context.dev. https://context.dev
const client = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY ?? '' })

export default defineTool({
  needsApproval: never(),
  description:
    'Extracts the design tokens for a domain — colors, typography, spacing, radii, and components.',
  inputSchema: z.object({ domain: z.string() }),
  async execute({ domain }) {
    return await client.web.extractStyleguide({ domain, timeoutMS: 120_000 })
  },
})
