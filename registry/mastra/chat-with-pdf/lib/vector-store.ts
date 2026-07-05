import { LibSQLVector } from '@mastra/libsql'

export const vectorStore = new LibSQLVector({
  id: 'pdf-vectors',
  url: process.env.LIBSQL_URL ?? 'file:./mastra.db',
})

export const PDF_INDEX_NAME = 'pdf_sections'

const EMBEDDING_DIMENSION = 1536

export async function ensureIndex(): Promise<void> {
  const indexes = await vectorStore.listIndexes()
  if (!indexes.includes(PDF_INDEX_NAME)) {
    await vectorStore.createIndex({
      indexName: PDF_INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: 'cosine',
    })
  }
}
