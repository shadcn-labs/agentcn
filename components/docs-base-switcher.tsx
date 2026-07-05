import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Base } from "@/registry/bases";
import { BASES } from "@/registry/bases";

export const DocsBaseSwitcher = ({
  base,
  agent,
  className,
}: {
  base: Base["name"];
  agent: string;
  className?: string;
}) => {
  const activeBase = BASES.find((baseItem) => base === baseItem.name);

  return (
    <div
      className={cn(
        "not-prose inline-flex w-full items-center gap-6",
        className
      )}
    >
      {BASES.map((baseItem) => (
        <Link
          className="relative inline-flex items-center justify-center gap-1 pt-1 pb-0.5 text-base font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[-4px] after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity hover:text-foreground data-[active=true]:text-foreground data-[active=true]:after:opacity-100"
          data-active={base === baseItem.name}
          href={`/docs/agents/${baseItem.name}/${agent}`}
          key={baseItem.name}
          scroll={false}
        >
          {baseItem.title}
        </Link>
      ))}
      {activeBase?.meta?.logo && (
        <div className="ml-auto shrink-0 text-muted-foreground opacity-80 [&_svg]:h-4 [&_svg]:w-fit">
          <activeBase.meta.logo />
        </div>
      )}
    </div>
  );
};
