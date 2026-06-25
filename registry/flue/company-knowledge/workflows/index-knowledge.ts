import type { FlueContext } from '@flue/runtime'
import { indexDoc } from '../lib/vector-store.ts'

export async function run({
  payload,
}: FlueContext<{ documents: { source: string; content: string }[] }>) {
  let indexed = 0
  for (const doc of payload.documents) {
    indexed += await indexDoc(doc)
  }
  return { documents: payload.documents.length, chunks: indexed }
}
