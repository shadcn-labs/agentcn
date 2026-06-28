import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { communityAgent } from "@/lib/db/schema";

export const runtime = "nodejs";

const REGISTRY_ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

/**
 * Serves a community agent as an installable shadcn registry item, mirroring
 * the static items emitted by scripts/build-registry.mts. Install with:
 *   npx shadcn@latest add https://agentcn.vercel.app/r/c/<code>
 */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) => {
  const { code } = await params;

  let agent: typeof communityAgent.$inferSelect | undefined;
  try {
    [agent] = await db
      .select()
      .from(communityAgent)
      .where(eq(communityAgent.code, code))
      .limit(1);
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  if (!agent) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const item = {
    $schema: REGISTRY_ITEM_SCHEMA,
    description: agent.description,
    files: agent.files.map((file) => ({
      content: file.content,
      path: file.path,
      target: file.target ?? file.path,
      type: file.type,
    })),
    name: `community-${agent.code}`,
    title: agent.title,
    type: "registry:block",
    ...(agent.dependencies.length ? { dependencies: agent.dependencies } : {}),
  };

  return Response.json(item, {
    headers: { "cache-control": "public, max-age=60, s-maxage=300" },
  });
};
