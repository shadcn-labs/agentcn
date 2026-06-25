import { openai } from '@ai-sdk/openai'
import { createClient } from '@libsql/client'
import { embed, embedMany } from 'ai'

const db = createClient({ url: process.env.LIBSQL_URL ?? 'file:knowledge.db' })
const embeddingModel = openai.embedding('text-embedding-3-small')

export interface Doc {
  source: string
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
    'CREATE TABLE IF NOT EXISTS docs (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, content TEXT, embedding F32_BLOB(1536))'
  )
}

export async function indexDoc(doc: Doc): Promise<number> {
  await ensureSchema()
  const chunks = chunkText(doc.content)
  const { embeddings } = await embedMany({ model: embeddingModel, values: chunks })
  for (let i = 0; i < chunks.length; i++) {
    await db.execute({
      sql: 'INSERT INTO docs (source, content, embedding) VALUES (?, ?, vector32(?))',
      args: [doc.source, chunks[i], JSON.stringify(embeddings[i])],
    })
  }
  return chunks.length
}

export async function searchDocs(query: string, topK: number) {
  await ensureSchema()
  const { embedding } = await embed({ model: embeddingModel, value: query })
  const result = await db.execute({
    sql: 'SELECT source, content, vector_distance_cos(embedding, vector32(?)) AS distance FROM docs ORDER BY distance ASC LIMIT ?',
    args: [JSON.stringify(embedding), topK],
  })
  return result.rows
}
