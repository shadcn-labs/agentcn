import { createStep, createWorkflow } from '@mastra/core/workflows'
import { ModelRouterEmbeddingModel } from '@mastra/core/llm'
import { MDocument } from '@mastra/rag'
import { z } from 'zod'
import { vectorStore, PDF_INDEX_NAME, ensureIndex } from '../lib/vector-store'

const EMBEDDING_DIMENSION = 1536

/**
 * Step 1: Download PDF and extract text from each page
 */
const downloadAndExtractText = createStep({
  id: 'download-and-extract-text',
  description: 'Download PDF from URL and extract text page by page',
  inputSchema: z.object({
    url: z.string().url().describe('URL of the PDF to ingest'),
    documentId: z.string().optional(),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    url: z.string(),
    totalPages: z.number(),
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        content: z.string(),
      }),
    ),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { url, documentId } = inputData

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    // Dynamic import for pdf-parse to avoid issues in some environments
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data })
    const info = await parser.getInfo()
    const totalPages = info.total

    const pages: { pageNumber: number; content: string }[] = []

    for (let i = 1; i <= totalPages; i++) {
      const result = await parser.getText({ partial: [i] })
      if (result.text.trim()) {
        pages.push({
          pageNumber: i,
          content: result.text,
        })
      }
    }

    await parser.destroy()

    const title = info.info?.Title || extractTitleFromUrl(url)
    const docId = documentId || generateDocumentId(url)

    return {
      documentId: docId,
      title: String(title),
      url,
      totalPages,
      pages,
    }
  },
})

/**
 * Step 2: Split pages into smaller chunks for embedding
 */
const splitIntoChunks = createStep({
  id: 'split-into-chunks',
  description: 'Split page text into smaller overlapping chunks',
  inputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    url: z.string(),
    totalPages: z.number(),
    pages: z.array(z.object({ pageNumber: z.number(), content: z.string() })),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    url: z.string(),
    totalPages: z.number(),
    chunks: z.array(
      z.object({
        text: z.string(),
        metadata: z.record(z.string(), z.any()),
      }),
    ),
  }),
  execute: async ({ inputData: { documentId, title, url, totalPages, pages } }) => {
    const allChunks: { text: string; metadata: Record<string, unknown> }[] = []

    for (const page of pages) {
      const doc = MDocument.fromText(page.content, {
        documentId,
        pageNumber: page.pageNumber,
      })

      const chunks = await doc.chunk({
        strategy: 'recursive',
        maxSize: 512,
        overlap: 50,
      })

      for (const chunk of chunks) {
        allChunks.push({
          text: String(chunk.text),
          metadata: {
            documentId,
            documentTitle: title,
            url,
            pageNumber: page.pageNumber,
            totalPages,
          },
        })
      }
    }

    return {
      documentId,
      title,
      url,
      totalPages,
      chunks: allChunks,
    }
  },
})

/**
 * Step 3: Generate embeddings and store in vector database
 */
const generateAndStoreEmbeddings = createStep({
  id: 'generate-and-store-embeddings',
  description: 'Generate embeddings for each chunk and store in vector database',
  inputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    url: z.string(),
    totalPages: z.number(),
    chunks: z.array(
      z.object({
        text: z.string(),
        metadata: z.record(z.string(), z.any()),
      }),
    ),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    totalPages: z.number(),
    totalChunks: z.number(),
  }),
  execute: async ({ inputData: { documentId, title, totalPages, chunks } }) => {
    await ensureIndex()

    const embeddingModel = new ModelRouterEmbeddingModel('openai/text-embedding-3-small')
    const texts = chunks.map((c) => c.text)
    const BATCH_SIZE = 2000
    const embeddings: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      const result = await embeddingModel.doEmbed({ values: batch })
      embeddings.push(...result.embeddings)
    }

    const metadata = chunks.map((c) => ({
      text: c.text,
      ...c.metadata,
    }))

    try {
      await vectorStore.deleteVectors({
        indexName: PDF_INDEX_NAME,
        filter: { documentId },
      })
    } catch {
      // Index might not exist yet or no vectors to delete
    }

    await vectorStore.upsert({
      indexName: PDF_INDEX_NAME,
      vectors: embeddings,
      metadata,
    })

    return {
      documentId,
      title,
      totalPages,
      totalChunks: chunks.length,
    }
  },
})

export const indexPdfWorkflow = createWorkflow({
  id: 'index-pdf',
  inputSchema: z.object({
    url: z.string().url().describe('URL of the PDF to ingest'),
    documentId: z.string().optional(),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    totalPages: z.number(),
    totalChunks: z.number(),
  }),
})
  .then(downloadAndExtractText)
  .then(splitIntoChunks)
  .then(generateAndStoreEmbeddings)

indexPdfWorkflow.commit()

function extractTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const filename = pathname.split('/').pop() || 'document'
    return filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
  } catch {
    return 'Untitled PDF'
  }
}

function generateDocumentId(url: string): string {
  return `pdf-${Buffer.from(url).toString('base64url').slice(-12)}`
}
