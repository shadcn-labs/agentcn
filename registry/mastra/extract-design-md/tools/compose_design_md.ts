import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { composeDesignMd } from '../lib/compose'

export default createTool({
  id: 'compose_design_md',
  description:
    'Composes the design artifacts for a domain from its context.dev styleguide, screenshot, and homepage Markdown: a self-contained DESIGN.md, a Tailwind v4 @theme block, and CSS :root tokens.',
  inputSchema: z.object({
    domain: z.string(),
  }),
  execute: async (inputData) => {
    const { domain } = inputData
    const normalized = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
    if (!normalized) {
      return { error: `"${domain}" is not a valid domain.` }
    }
    return await composeDesignMd(normalized)
  },
})
