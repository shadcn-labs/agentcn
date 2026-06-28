import { Info, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AgentCard } from "@/components/community/agent-card";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { CommunityToolbar } from "@/components/community/community-toolbar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getTagCounts, listCommunityAgents } from "@/lib/community/queries";
import { getSession } from "@/lib/community/session";
import { parseScope, parseSort, parseWindow } from "@/lib/community/types";
import type { Scope } from "@/lib/community/types";

export const metadata: Metadata = {
  description: "Discover and publish AI agents built by the community.",
  title: "Community Agents",
};

const emptyMessage = (scope: Scope, signedIn: boolean): string => {
  if (scope === "my") {
    return signedIn
      ? "You haven't published any agents yet."
      : "Sign in to see the agents you've published.";
  }
  if (scope === "liked") {
    return signedIn
      ? "You haven't liked any agents yet."
      : "Sign in to see the agents you've liked.";
  }
  return "No agents yet. Be the first to publish one!";
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const scope = parseScope(sp.scope);
  const sort = parseSort(sp.sort);
  const timeWindow = parseWindow(sp.window);
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const session = await getSession();
  const userId = session?.user.id;

  const [agents, tags] = await Promise.all([
    listCommunityAgents({ scope, sort, tag, userId, window: timeWindow }),
    getTagCounts(),
  ]);

  return (
    <div className="container-wrapper flex-1">
      <div className="3xl:fixed:container px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={null}>
              <CommunitySidebar tags={tags} />
            </Suspense>
          </aside>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Suspense fallback={null}>
                <CommunityToolbar />
              </Suspense>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild sound="click">
                  <Link href={ROUTES.DOCS_REGISTRY}>
                    <Info />
                    How to publish
                  </Link>
                </Button>
                <Button size="sm" asChild sound="click">
                  <Link href={ROUTES.COMMUNITY_PUBLISH}>
                    <Plus />
                    Publish agent
                  </Link>
                </Button>
              </div>
            </div>

            {agents.length === 0 ? (
              <div className="text-muted-foreground flex min-h-60 items-center justify-center rounded-xl border border-dashed text-sm">
                {emptyMessage(scope, Boolean(userId))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {agents.map((agent) => (
                  <AgentCard key={agent.code} agent={agent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
