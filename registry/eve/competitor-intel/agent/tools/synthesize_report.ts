import { defineTool } from 'eve/tools'
import { z } from 'zod'

export default defineTool({
  description: 'Saves the final synthesized competitor report. Call this once all URLs have been analyzed.',
  inputSchema: z.object({
    competitors: z.array(z.object({
      url: z.string(),
      positioning: z.string(),
      pricing: z.string(),
      keyFeatures: z.array(z.string()),
    })),
    summary: z.string(),
  }),
  async execute(report) {
    return JSON.stringify(report, null, 2)
  },
})
