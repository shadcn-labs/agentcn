import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

interface FunctionDoc {
  name: string
  signature: string
  description: string
}

const DATA_URL = new URL('../data/functions.json', import.meta.url)

export default createTool({
  id: 'lookup_docs',
  description:
    'Looks up library functions matching a name or keyword and returns their documentation.',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async (inputData) => {
    const { query } = inputData
    const docs = JSON.parse(
      await readFile(fileURLToPath(DATA_URL), 'utf-8')
    ) as FunctionDoc[]
    const q = query.toLowerCase()
    const matches = docs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    )
    return matches.length
      ? { matches }
      : { suggestions: docs.map((d) => d.name) }
  },
})
