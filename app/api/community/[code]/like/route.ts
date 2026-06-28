import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentLike, communityAgent } from "@/lib/db/schema";

export const runtime = "nodejs";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) => {
  const { code } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [agent] = await db
    .select({ id: communityAgent.id })
    .from(communityAgent)
    .where(eq(communityAgent.code, code))
    .limit(1);

  if (!agent) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ userId: agentLike.userId })
    .from(agentLike)
    .where(and(eq(agentLike.agentId, agent.id), eq(agentLike.userId, userId)))
    .limit(1);

  let liked: boolean;
  if (existing) {
    await db
      .delete(agentLike)
      .where(
        and(eq(agentLike.agentId, agent.id), eq(agentLike.userId, userId))
      );
    await db
      .update(communityAgent)
      .set({ likeCount: sql`greatest(${communityAgent.likeCount} - 1, 0)` })
      .where(eq(communityAgent.id, agent.id));
    liked = false;
  } else {
    await db.insert(agentLike).values({ agentId: agent.id, userId });
    await db
      .update(communityAgent)
      .set({ likeCount: sql`${communityAgent.likeCount} + 1` })
      .where(eq(communityAgent.id, agent.id));
    liked = true;
  }

  const [row] = await db
    .select({ likeCount: communityAgent.likeCount })
    .from(communityAgent)
    .where(eq(communityAgent.id, agent.id))
    .limit(1);

  return Response.json({ likeCount: row?.likeCount ?? 0, liked });
};
