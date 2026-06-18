"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { Input } from "@/components/ui/input";
import type { ChatMessage, FrameworkId } from "@/constants/agents";
import {
  AGENTS,
  FRAMEWORKS,
  getAgent,
  installCommand,
} from "@/constants/agents";
import { cn } from "@/lib/utils";

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  if (message.role === "tool") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">⚙</span>
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
          {message.tool}
        </code>
        <span className="text-muted-foreground/70 truncate">
          {message.detail}
        </span>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {message.text}
      </div>
    </div>
  );
};

export const HomeAgentPreview = ({ className }: { className?: string }) => {
  const [selectedSlug, setSelectedSlug] = useState(AGENTS[0].slug);
  const [framework, setFramework] = useState<FrameworkId>(
    AGENTS[0].frameworks[0]
  );
  const [query, setQuery] = useState("");

  const agent = getAgent(selectedSlug) ?? AGENTS[0];

  const filteredAgents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return AGENTS;
    }
    return AGENTS.filter(
      (item) =>
        item.shortTitle.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
    );
  }, [query]);

  const selectAgent = (slug: string) => {
    const next = getAgent(slug);
    if (!next) {
      return;
    }
    setSelectedSlug(slug);
    // Keep the framework valid for the newly selected agent.
    if (!next.frameworks.includes(framework)) {
      setFramework(next.frameworks[0]);
    }
  };

  const availableFrameworks = FRAMEWORKS.filter((item) =>
    agent.frameworks.includes(item.id)
  );

  const transcript = agent.transcript[framework];
  const command = installCommand(framework, agent.slug);

  return (
    <div
      className={cn(
        "bg-card overflow-hidden rounded-xl border text-left shadow-sm",
        className
      )}
    >
      {/* Navbar: agent header (left) + framework switcher and install command (right) */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="truncate text-sm font-semibold">{agent.title}</span>

        <div className="flex min-w-0 items-center gap-2">
          <div className="bg-muted flex shrink-0 items-center gap-0.5 rounded-md p-0.5">
            {availableFrameworks.map((item) => (
              <button
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  framework === item.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                key={item.id}
                onClick={() => setFramework(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="bg-muted flex min-w-0 items-center gap-1 rounded-md py-1 pr-1 pl-2.5">
            <code className="text-muted-foreground truncate font-mono text-xs">
              {command}
            </code>
            <CopyButton
              aria-label="Copy install command"
              className="size-6 shrink-0"
              event="copy_npm_command"
              value={command}
              variant="ghost"
            />
          </div>
        </div>
      </div>

      {/* Body: agent sidebar (left) + chat preview (right) */}
      <div className="grid sm:grid-cols-[14rem_1fr]">
        <aside className="flex flex-col border-b sm:border-r sm:border-b-0">
          <div className="relative p-2.5">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-5 size-3.5 -translate-y-1/2" />
            <Input
              className="h-8 pl-7 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agents…"
              value={query}
            />
          </div>

          <nav className="flex flex-col gap-0.5 px-2 pb-2.5">
            {filteredAgents.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-xs">
                No agents found.
              </p>
            ) : (
              filteredAgents.map((item) => (
                <button
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    item.slug === agent.slug
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/60"
                  )}
                  key={item.slug}
                  onClick={() => selectAgent(item.slug)}
                  type="button"
                >
                  <span className="text-sm font-medium">{item.shortTitle}</span>
                  <span className="text-muted-foreground line-clamp-1 text-xs">
                    {item.description}
                  </span>
                </button>
              ))
            )}
          </nav>
        </aside>

        <div className="bg-background/40 flex max-h-96 min-h-72 flex-col gap-3 overflow-y-auto p-4">
          {transcript.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
};
