"use client";

import { useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SITE } from "@/constants/site";
import { cn } from "@/lib/utils";

const RECIPES = [
  { framework: "eve", label: "Eve" },
  { framework: "flue", label: "Flue" },
] as const;

const installCommand = (framework: string) =>
  `npx shadcn@latest add ${SITE.REGISTRY}/r/${framework}/competitor-intel`;

export const AgentInstallTabs = ({ className }: { className?: string }) => {
  const [framework, setFramework] = useState<string>(RECIPES[0].framework);

  return (
    <div
      className={cn(
        "bg-code text-code-foreground relative overflow-hidden rounded-lg text-sm",
        className
      )}
    >
      <Tabs className="gap-0" onValueChange={setFramework} value={framework}>
        <div className="border-border/50 flex items-center gap-2 border-b px-3 py-1">
          <TabsList className="rounded-none bg-transparent p-0">
            {RECIPES.map((recipe) => (
              <TabsTrigger
                className="data-[state=active]:border-input h-7 border border-transparent pt-0.5 data-[state=active]:shadow-none"
                key={recipe.framework}
                sound="tabSwitch"
                value={recipe.framework}
              >
                {recipe.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {RECIPES.map((recipe) => (
          <TabsContent
            className="mt-0 px-4 py-3.5"
            key={recipe.framework}
            value={recipe.framework}
          >
            <pre className="no-scrollbar overflow-x-auto">
              <code
                className="text-muted-foreground block text-left font-mono text-sm"
                data-language="bash"
              >
                <span className="select-none">$ </span>
                npx shadcn@latest add{" "}
                <span className="text-foreground">
                  {SITE.REGISTRY}/r/{recipe.framework}/competitor-intel
                </span>
              </code>
            </pre>
          </TabsContent>
        ))}
      </Tabs>

      <CopyButton
        className="absolute top-2 right-2 z-10 size-7 opacity-70 hover:opacity-100 focus-visible:opacity-100"
        event="copy_npm_command"
        value={() => installCommand(framework)}
      />
    </div>
  );
};
