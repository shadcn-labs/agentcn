/**
 * Drizzle schema for the community feature.
 *
 * The first four tables (`user`, `session`, `account`, `verification`) are the
 * standard Better Auth schema. The remaining tables power the community agent
 * gallery: self-published agents, their tags, and per-user likes.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  id: text("id").primaryKey(),
  image: text("image"),
  name: text("name").notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  id: text("id").primaryKey(),
  ipAddress: text("ip_address"),
  token: text("token").notNull().unique(),
  updatedAt: timestamp("updated_at").notNull(),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  accessToken: text("access_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  accountId: text("account_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  id: text("id").primaryKey(),
  idToken: text("id_token"),
  password: text("password"),
  providerId: text("provider_id").notNull(),
  refreshToken: text("refresh_token"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  updatedAt: timestamp("updated_at").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verification", {
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  expiresAt: timestamp("expires_at").notNull(),
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  value: text("value").notNull(),
});

// ---------------------------------------------------------------------------
// Community tables
// ---------------------------------------------------------------------------

/** A shadcn registry file, inlined exactly as the build script emits them. */
export interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target?: string;
}

export const communityAgent = pgTable(
  "community_agent",
  {
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Short, URL-safe code used in the install URL: /r/c/<code>.
    code: text("code").notNull().unique(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    dependencies: jsonb("dependencies").$type<string[]>().default([]).notNull(),
    description: text("description").notNull(),
    files: jsonb("files").$type<RegistryFile[]>().notNull(),
    framework: text("framework", { enum: ["eve", "flue"] }).notNull(),
    id: text("id").primaryKey(),
    // Denormalized for cheap "Popular" sorting; agentLike is the source of truth.
    likeCount: integer("like_count").default(0).notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("community_agent_author_idx").on(table.authorId),
    index("community_agent_created_idx").on(table.createdAt),
    index("community_agent_likes_idx").on(table.likeCount),
  ]
);

export const agentTag = pgTable(
  "agent_tag",
  {
    agentId: text("agent_id")
      .notNull()
      .references(() => communityAgent.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.tag] }),
    index("agent_tag_tag_idx").on(table.tag),
  ]
);

export const agentLike = pgTable(
  "agent_like",
  {
    agentId: text("agent_id")
      .notNull()
      .references(() => communityAgent.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.userId] }),
    uniqueIndex("agent_like_unique_idx").on(table.agentId, table.userId),
    index("agent_like_user_idx").on(table.userId),
  ]
);
