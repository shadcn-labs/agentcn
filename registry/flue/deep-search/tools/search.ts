import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

type SerpResult = { title?: string; link?: string; description?: string }

export const webSearch = defineTool({
  name: 'web_search',
  description:
    'Searches the web and returns ranked results with titles, URLs, and text snippets.',
  parameters: v.object({
    query: v.string(),
    numResults: v.optional(v.number(), 5),
  }),
  execute: async ({ query, numResults }) => {
    const target = new URL('https://www.google.com/search')
    target.searchParams.set('q', query)
    target.searchParams.set('num', String(numResults))
    target.searchParams.set('brd_json', '1')

    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        zone: process.env.BRIGHTDATA_SERP_ZONE ?? 'serp_api',
        url: target.toString(),
        format: 'raw',
      }),
    })

    const data = (await res.json()) as { organic?: SerpResult[] }
    return JSON.stringify(
      (data.organic ?? [])
        .slice(0, numResults)
        .map((r) => ({ title: r.title, url: r.link, text: r.description }))
    )
  },
})
