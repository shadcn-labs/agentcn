import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'
import { chunkText, indexDoc } from '../lib/vector-store'

const fetchContent = createStep({
  id: 'fetch-content',
  description: 'Fetches content from a URL',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    source: z.string(),
    content: z.string(),
  }),
  execute: async ({ inputData }) => {
    const response = await fetch(inputData.url)
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`)
    }
    const content = await response.text()
    return { source: inputData.url, content }
  },
})

const chunkContent = createStep({
  id: 'chunk-content',
  description: 'Splits content into chunks for embedding',
  inputSchema: z.object({
    source: z.string(),
    content: z.string(),
  }),
  outputSchema: z.object({
    source: z.string(),
    chunks: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const chunks = chunkText(inputData.content)
    return { source: inputData.source, chunks }
  },
})

const embedAndStore = createStep({
  id: 'embed-and-store',
  description: 'Embeds chunks and stores them in the vector database',
  inputSchema: z.object({
    source: z.string(),
    chunks: z.array(z.string()),
  }),
  outputSchema: z.object({
    source: z.string(),
    chunksStored: z.number(),
  }),
  execute: async ({ inputData }) => {
    const chunksStored = await indexDoc({
      source: inputData.source,
      content: inputData.chunks.join('\n\n'),
    })
    return { source: inputData.source, chunksStored }
  },
})

export const indexKnowledgeWorkflow = createWorkflow({
  id: 'index-knowledge-workflow',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    source: z.string(),
    chunksStored: z.number(),
  }),
})
  .then(fetchContent)
  .then(chunkContent)
  .then(embedAndStore)

indexKnowledgeWorkflow.commit()
