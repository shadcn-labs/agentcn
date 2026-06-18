"use client";

import Link from "next/link";

import type { FrameworkId } from "@/constants/agents";
import { FRAMEWORKS } from "@/constants/agents";
import { cn } from "@/lib/utils";

interface FrameworkDocTabsProps {
  /** Agent slug, e.g. "competitor-intel". */
  agent: string;
  /** The framework this page documents — its tab renders active. */
  current: FrameworkId;
}

/**
 * Underline tabs that switch between a recipe's per-framework doc routes. Each
 * tab is a real link, so switching frameworks updates the URL (and the browser
 * history) rather than toggling content in place.
 */
export const FrameworkDocTabs = ({ agent, current }: FrameworkDocTabsProps) => (
  <div className="not-prose mt-6 flex justify-start gap-4 border-b">
    {FRAMEWORKS.map((framework) => {
      const active = framework.id === current;

      return (
        <Link
          aria-current={active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 border-transparent pb-3 text-base transition-colors",
            active
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-primary"
          )}
          href={`/docs/agents/${framework.id}/${agent}`}
          key={framework.id}
          scroll={false}
        >
          {framework.label}
        </Link>
      );
    })}
  </div>
);
