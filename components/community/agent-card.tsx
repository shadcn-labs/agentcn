import Link from "next/link";

import { LikeButton } from "@/components/community/like-button";
import { Badge } from "@/components/ui/badge";
import type { CommunityAgentCard } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const FrameworkBadge = ({ framework }: { framework: "eve" | "flue" }) => (
  <Badge
    variant="outline"
    className="bg-background/60 shrink-0 capitalize backdrop-blur"
  >
    <span
      className={cn(
        "size-1.5 rounded-full",
        framework === "eve" ? "bg-violet-500" : "bg-sky-500"
      )}
    />
    {framework}
  </Badge>
);

const AuthorAvatar = ({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) =>
  image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={name}
      width={20}
      height={20}
      className="size-5 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium uppercase">
      {name.charAt(0)}
    </span>
  );

export const AgentCard = ({ agent }: { agent: CommunityAgentCard }) => {
  const extraTags = agent.tags.length - 2;

  return (
    <Link
      href={`/community/${agent.code}`}
      className="group focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-[3px]"
    >
      <article className="bg-card hover:border-foreground/20 overflow-hidden rounded-xl border transition-colors">
        <div className="from-muted/70 to-muted/20 relative flex h-40 flex-col justify-between bg-gradient-to-br p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {agent.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-background/60 backdrop-blur"
                >
                  {tag}
                </Badge>
              ))}
              {extraTags > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-background/60 backdrop-blur"
                >
                  +{extraTags}
                </Badge>
              )}
            </div>
            <FrameworkBadge framework={agent.framework} />
          </div>
          <h3 className="line-clamp-2 text-xl font-semibold tracking-tight">
            {agent.title}
          </h3>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <AuthorAvatar name={agent.authorName} image={agent.authorImage} />
            <span className="truncate text-sm">{agent.authorName}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {dateFormatter.format(agent.createdAt)}
            </span>
          </div>
          <LikeButton
            code={agent.code}
            initialLiked={agent.isLiked}
            initialCount={agent.likeCount}
          />
        </div>
      </article>
    </Link>
  );
};
