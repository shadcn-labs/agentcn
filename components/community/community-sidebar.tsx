"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { parseScope } from "@/lib/community/types";
import type { Scope } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const SCOPES: { value: Scope; label: string }[] = [
  { label: "All Agents", value: "all" },
  { label: "My Agents", value: "my" },
  { label: "Liked Agents", value: "liked" },
];

export const CommunitySidebar = ({
  tags,
}: {
  tags: { tag: string; count: number }[];
}) => {
  const searchParams = useSearchParams();
  const scope = parseScope(searchParams.get("scope"));
  const activeTag = searchParams.get("tag") ?? undefined;

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    return qs ? `${ROUTES.COMMUNITY}?${qs}` : ROUTES.COMMUNITY;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Community Agents
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Discover agents by the community
        </p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {SCOPES.map((item) => {
          const active = scope === item.value;
          return (
            <Link
              key={item.value}
              href={buildHref({
                scope: item.value === "all" ? undefined : item.value,
              })}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {tags.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground px-3 text-xs font-medium tracking-wide uppercase">
            Tags
          </p>
          <div className="flex flex-col gap-0.5">
            {tags.map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <Link
                  key={tag}
                  href={buildHref({ tag: active ? undefined : tag })}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <span className="truncate">{tag}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
