import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LikeButton } from "@/components/community/like-button";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import { getCommunityAgent } from "@/lib/community/queries";
import { getSession } from "@/lib/community/session";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> => {
  const { code } = await params;
  const agent = await getCommunityAgent(code);
  if (!agent) {
    return { title: "Agent not found" };
  }
  return { description: agent.description, title: agent.title };
};

export default async function CommunityAgentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getSession();
  const agent = await getCommunityAgent(code, session?.user.id);

  if (!agent) {
    notFound();
  }

  const installUrl = `${SITE.URL}/r/c/${agent.code}`;
  const installCommand = `npx shadcn@latest add ${installUrl}`;

  return (
    <div className="container-wrapper flex-1">
      <div className="3xl:fixed:container px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Link
            href={ROUTES.COMMUNITY}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to community
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {agent.framework}
                </Badge>
                {agent.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {agent.title}
              </h1>
              <p className="text-muted-foreground">{agent.description}</p>
              <p className="text-muted-foreground text-sm">
                by {agent.authorName} · {dateFormatter.format(agent.createdAt)}
              </p>
            </div>
            <LikeButton
              code={agent.code}
              initialLiked={agent.isLiked}
              initialCount={agent.likeCount}
              className="text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Install</span>
            <div className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg border px-4 py-2">
              <code className="overflow-x-auto font-mono text-sm">
                {installCommand}
              </code>
              <CopyButton
                value={installCommand}
                variant="ghost"
                size="icon-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">
              Files ({agent.files.length})
            </span>
            {agent.files.map((file) => (
              <div
                key={file.path}
                className="overflow-hidden rounded-lg border"
              >
                <div className="bg-muted/40 flex items-center justify-between border-b px-4 py-2">
                  <code className="font-mono text-xs">{file.path}</code>
                  <CopyButton
                    value={file.content}
                    variant="ghost"
                    size="icon-sm"
                  />
                </div>
                <pre className="overflow-x-auto p-4 text-xs">
                  <code>{file.content}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
