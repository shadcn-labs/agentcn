import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

export const scrapeUrl = defineTool({
  name: 'scrape_url',
  description: 'Scrapes a URL and returns the page content as markdown.',
  parameters: v.object({
    url: v.string(),
  }),
  execute: async ({ url }) => {
    const res = await fetch(`https://r.jina.ai/${url}`)
    return res.text()
  },
})
