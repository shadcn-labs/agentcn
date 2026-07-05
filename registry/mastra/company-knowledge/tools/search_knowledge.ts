import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { redactPii } from '../lib/pii'
import { searchDocs } from '../lib/vector-store'

export default createTool({
  id: 'search_knowledge',
  description:
    'Semantic search over indexed Linear issues and Notion pages. Use this BEFORE falling back to live Linear/Notion lookups or web search.',
  inputSchema: z.object({
    query: z.string().describe('A search query to find relevant company knowledge'),
    topK: z.number().min(1).max(10).default(5).describe('Number of results to return'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      content: z.string(),
      source: z.string(),
      title: z.string().optional(),
      url: z.string().optional(),
      score: z.number().optional(),
    })),
  }),
  execute: async (inputData) => {
    const { query, topK } = inputData
    const hits = await searchDocs(query, topK)
    const results = hits.map((row) => ({
      content: redactPii(String(row.content)),
      source: String(row.source),
      title: row.title ? String(row.title) : undefined,
      url: row.url ? String(row.url) : undefined,
      score: row.score ? Number(row.score) : undefined,
    }))
    return { results }
  },
})