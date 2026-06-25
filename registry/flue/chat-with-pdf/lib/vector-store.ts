import { openai } from '@ai-sdk/openai'
import { createClient } from '@libsql/client'
import { embed, embedMany } from 'ai'

const db = createClient({ url: process.env.LIBSQL_URL ?? 'file:pdf-index.db' })
const embeddingModel = openai.embedding('text-embedding-3-small')

export interface Chunk {
  doc: string
  page: number
  content: string
}

export function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size - overlap) {
    const slice = text.slice(i, i + size).trim()
    if (slice) {
      out.push(slice)
    }
  }
  return out
}

async function ensureSchema(): Promise<void> {
  await db.execute(
    'CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, doc TEXT, page INTEGER, content TEXT, embedding F32_BLOB(1536))'
  )
}

export async function upsertChunks(chunks: Chunk[]): Promise<void> {
  await ensureSchema()
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((c) => c.content),
  })
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]
    await db.execute({
      sql: 'INSERT INTO chunks (doc, page, content, embedding) VALUES (?, ?, ?, vector32(?))',
      args: [c.doc, c.page, c.content, JSON.stringify(embeddings[i])],
    })
  }
}

export async function search(query: string, topK: number) {
  await ensureSchema()
  const { embedding } = await embed({ model: embeddingModel, value: query })
  const result = await db.execute({
    sql: 'SELECT doc, page, content, vector_distance_cos(embedding, vector32(?)) AS distance FROM chunks ORDER BY distance ASC LIMIT ?',
    args: [JSON.stringify(embedding), topK],
  })
  return result.rows
}
