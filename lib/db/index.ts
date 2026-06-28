import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Surfaced at runtime rather than build time so the rest of the site keeps
  // working until real Neon credentials are dropped into .env.
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL is not set — community features will not work.");
}

const sql = neon(connectionString ?? "postgres://placeholder/placeholder");

export const db = drizzle(sql, { schema });
