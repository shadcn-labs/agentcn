import { defineTool } from 'eve/tools'
import { z } from 'zod'

export default defineTool({
  description: 'Scrapes a URL and returns the page content as markdown.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const res = await fetch(`https://r.jina.ai/${url}`)
    return res.text()
  },
})
