import Link from "next/link";

import { AgentAnimation } from "@/components/agent-animations";
import { AGENTS } from "@/constants/agents";
import type { FrameworkId } from "@/constants/agents";
import { cn } from "@/lib/utils";

export const AgentsList = ({
  framework,
  className,
}: {
  framework?: FrameworkId;
  className?: string;
}) => {
  const agents = framework
    ? AGENTS.filter((a) => a.frameworks.includes(framework))
    : AGENTS;

  return (
    <div
      className={cn(
        "not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {agents.map((agent) => (
        <Link
          className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
          href={`/docs/agents/${framework ?? "eve"}/${agent.slug}`}
          key={agent.slug}
        >
          <div className="relative h-32 overflow-hidden border-b bg-gradient-to-b from-muted/40 to-background">
            <AgentAnimation
              className="px-8 py-4 transition-transform duration-500 group-hover:scale-105"
              slug={agent.slug}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <h3 className="font-medium leading-none transition-colors group-hover:text-primary">
              {agent.shortTitle}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {agent.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};
