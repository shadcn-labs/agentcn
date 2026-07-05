import { createClient } from '@libsql/client'

export const db = createClient({
  url: process.env.DATABASE_URL ?? 'file:data.db',
})
