import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const runPagespeed = createTool({
  id: 'run-pagespeed',
  description: 'Run PageSpeed Insights test on a URL and return performance metrics',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to test'),
    strategy: z.enum(['mobile', 'desktop']).default('mobile').describe('Testing strategy'),
  }),
  outputSchema: z.object({
    score: z.number(),
    lcp: z.number(),
    inp: z.number(),
    cls: z.number(),
    fcp: z.number(),
    tbt: z.number(),
    si: z.number(),
  }),
  execute: async ({ context }) => {
    const { url, strategy } = context
    const apiKey = process.env.PAGESPEED_API_KEY
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}`
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    const metrics = data.lighthouseResult.audits
    return {
      score: data.lighthouseResult.categories.performance.score * 100,
      lcp: metrics['largest-contentful-paint'].numericValue,
      inp: metrics['interaction-to-next-paint']?.numericValue || 0,
      cls: metrics['cumulative-layout-shift'].numericValue,
      fcp: metrics['first-contentful-paint'].numericValue,
      tbt: metrics['total-blocking-time'].numericValue,
      si: metrics['speed-index'].numericValue,
    }
  },
})