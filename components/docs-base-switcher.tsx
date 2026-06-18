import Link from "next/link";

import type { FrameworkId } from "@/constants/agents";
import { FRAMEWORKS } from "@/constants/agents";
import { cn } from "@/lib/utils";

export const DocsBaseSwitcher = ({
  base,
  agent,
  className,
}: {
  base: FrameworkId;
  agent: string;
  className?: string;
}) => (
  <div
    className={cn("not-prose inline-flex w-full items-center gap-6", className)}
  >
    {FRAMEWORKS.map((baseItem) => (
      <Link
        className="relative inline-flex items-center justify-center gap-1 pt-1 pb-0.5 text-base font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[-4px] after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity hover:text-foreground data-[active=true]:text-foreground data-[active=true]:after:opacity-100"
        data-active={base === baseItem.id}
        href={`/docs/agents/${baseItem.id}/${agent}`}
        key={baseItem.id}
        scroll={false}
      >
        {baseItem.label}
      </Link>
    ))}
  </div>
);
