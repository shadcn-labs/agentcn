import "server-only";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { windowStart } from "@/lib/community/types";
import type {
  CommunityAgentCard,
  CommunityAgentDetail,
  Scope,
  Sort,
  TimeWindow,
} from "@/lib/community/types";
import { db } from "@/lib/db";
import { agentLike, agentTag, communityAgent, user } from "@/lib/db/schema";

interface ListParams {
  scope: Scope;
  sort: Sort;
  window: TimeWindow;
  tag?: string;
  userId?: string;
}

const orderFor = (sort: Sort) => {
  if (sort === "newest") {
    return [desc(communityAgent.createdAt)];
  }
  if (sort === "oldest") {
    return [asc(communityAgent.createdAt)];
  }
  return [desc(communityAgent.likeCount), desc(communityAgent.createdAt)];
};

/** Attaches the `tags` array to a set of agent cards in a single extra query. */
const withTags = async <T extends { code: string; tags: string[] }>(
  cards: T[],
  codeToId: Map<string, string>
): Promise<T[]> => {
  const ids = [...codeToId.values()];
  if (ids.length === 0) {
    return cards;
  }
  const tagRows = await db
    .select({ agentId: agentTag.agentId, tag: agentTag.tag })
    .from(agentTag)
    .where(inArray(agentTag.agentId, ids));

  const byId = new Map<string, string[]>();
  for (const row of tagRows) {
    const list = byId.get(row.agentId) ?? [];
    list.push(row.tag);
    byId.set(row.agentId, list);
  }
  for (const card of cards) {
    const id = codeToId.get(card.code);
    card.tags = (id && byId.get(id)) || [];
  }
  return cards;
};

export const listCommunityAgents = async (
  params: ListParams
): Promise<CommunityAgentCard[]> => {
  const { scope, sort, window, tag, userId } = params;

  try {
    const filters = [];

    const start = windowStart(window);
    if (start) {
      filters.push(gte(communityAgent.createdAt, start));
    }
    if (scope === "my" && userId) {
      filters.push(eq(communityAgent.authorId, userId));
    }
    if (tag) {
      filters.push(
        inArray(
          communityAgent.id,
          db
            .select({ id: agentTag.agentId })
            .from(agentTag)
            .where(eq(agentTag.tag, tag))
        )
      );
    }
    // "Liked" scope: restrict to agents the user has liked.
    if (scope === "liked") {
      if (!userId) {
        return [];
      }
      filters.push(
        inArray(
          communityAgent.id,
          db
            .select({ id: agentLike.agentId })
            .from(agentLike)
            .where(eq(agentLike.userId, userId))
        )
      );
    }

    const likedExpr = userId
      ? sql<boolean>`exists (select 1 from ${agentLike} where ${agentLike.agentId} = ${communityAgent.id} and ${agentLike.userId} = ${userId})`
      : sql<boolean>`false`;

    const rows = await db
      .select({
        authorImage: user.image,
        authorName: user.name,
        code: communityAgent.code,
        createdAt: communityAgent.createdAt,
        description: communityAgent.description,
        framework: communityAgent.framework,
        id: communityAgent.id,
        isLiked: likedExpr,
        likeCount: communityAgent.likeCount,
        title: communityAgent.title,
      })
      .from(communityAgent)
      .innerJoin(user, eq(communityAgent.authorId, user.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(...orderFor(sort))
      .limit(200);

    const codeToId = new Map(rows.map((r) => [r.code, r.id]));
    const cards: CommunityAgentCard[] = rows.map((r) => ({
      authorImage: r.authorImage,
      authorName: r.authorName,
      code: r.code,
      createdAt: r.createdAt,
      description: r.description,
      framework: r.framework,
      isLiked: Boolean(r.isLiked),
      likeCount: r.likeCount,
      tags: [],
      title: r.title,
    }));
    return await withTags(cards, codeToId);
  } catch (error) {
    // No DB configured yet (placeholder DATABASE_URL): render an empty gallery
    // instead of crashing the page.
    // eslint-disable-next-line no-console
    console.warn("listCommunityAgents failed:", (error as Error).message);
    return [];
  }
};

export const getTagCounts = async (): Promise<
  { tag: string; count: number }[]
> => {
  try {
    return await db
      .select({ count: count(), tag: agentTag.tag })
      .from(agentTag)
      .groupBy(agentTag.tag)
      .orderBy(desc(count()));
  } catch {
    return [];
  }
};

export const getCommunityAgent = async (
  code: string,
  userId?: string
): Promise<CommunityAgentDetail | null> => {
  try {
    const [row] = await db
      .select({
        authorImage: user.image,
        authorName: user.name,
        code: communityAgent.code,
        createdAt: communityAgent.createdAt,
        dependencies: communityAgent.dependencies,
        description: communityAgent.description,
        files: communityAgent.files,
        framework: communityAgent.framework,
        id: communityAgent.id,
        likeCount: communityAgent.likeCount,
        title: communityAgent.title,
      })
      .from(communityAgent)
      .innerJoin(user, eq(communityAgent.authorId, user.id))
      .where(eq(communityAgent.code, code))
      .limit(1);

    if (!row) {
      return null;
    }

    const tagRows = await db
      .select({ tag: agentTag.tag })
      .from(agentTag)
      .where(eq(agentTag.agentId, row.id));

    let isLiked = false;
    if (userId) {
      const [like] = await db
        .select({ userId: agentLike.userId })
        .from(agentLike)
        .where(and(eq(agentLike.agentId, row.id), eq(agentLike.userId, userId)))
        .limit(1);
      isLiked = Boolean(like);
    }

    return {
      authorImage: row.authorImage,
      authorName: row.authorName,
      code: row.code,
      createdAt: row.createdAt,
      dependencies: row.dependencies,
      description: row.description,
      files: row.files,
      framework: row.framework,
      isLiked,
      likeCount: row.likeCount,
      tags: tagRows.map((t) => t.tag),
      title: row.title,
    };
  } catch {
    return null;
  }
};
