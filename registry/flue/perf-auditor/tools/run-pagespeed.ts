import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

export const runPagespeed = defineTool({
  name: 'run_pagespeed',
  description: 'Runs PageSpeed Insights on a URL and returns performance metrics.',
  parameters: v.object({
    url: v.string(),
    strategy: v.optional(v.union([v.literal('mobile'), v.literal('desktop')])),
  }),
  execute: async ({ url, strategy = 'mobile' }) => {
    const apiKey = process.env.PAGESPEED_API_KEY
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ''}`

    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`)
    }

    const data = await response.json() as {
      lighthouseResult?: {
        categories?: {
          performance?: { score: number }
        }
        audits?: {
          'largest-contentful-paint'?: { displayValue: string; score: number }
          'cumulative-layout-shift'?: { displayValue: string; score: number }
          'total-blocking-time'?: { displayValue: string; score: number }
        }
      }
    }

    const result = data.lighthouseResult
    if (!result) {
      throw new Error('No lighthouse result returned')
    }

    return JSON.stringify({
      url,
      strategy,
      performanceScore: result.categories?.performance?.score ?? 0,
      lcp: result.audits?.['largest-contentful-paint']?.displayValue,
      cls: result.audits?.['cumulative-layout-shift']?.displayValue,
      tbt: result.audits?.['total-blocking-time']?.displayValue,
    })
  },
})
