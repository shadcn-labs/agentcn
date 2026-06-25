"use client";

import { Check, SearchIcon, Terminal } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ChatMessage, FrameworkId } from "@/constants/agents";
import {
  AGENTS,
  FRAMEWORKS,
  getAgent,
  installCommand,
} from "@/constants/agents";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
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
  const { copyToClipboard, isCopied } = useCopyToClipboard();

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
        <div className="flex flex-1 min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-semibold">
            {agent.title}
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={framework}
            onValueChange={(value) => {
              if (value) {
                setFramework(value as FrameworkId);
              }
            }}
          >
            {availableFrameworks.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(command)}
        >
          {isCopied ? <Check /> : <Terminal />}
          <span className="truncate">{command}</span>
        </Button>
      </div>

      {/* Body: agent sidebar (left) + chat preview (right) */}
      <div className="grid sm:grid-cols-[16rem_1fr]">
        <aside className="flex h-[60vh] flex-col border-b sm:border-r sm:border-b-0">
          <div className="p-2.5">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents…"
                value={query}
              />
              {query && (
                <InputGroupAddon align="inline-end">
                  <InputGroupText>
                    {filteredAgents.length} result
                    {filteredAgents.length === 1 ? "" : "s"}
                  </InputGroupText>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2.5">
            {filteredAgents.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-2 py-1.5">
                <p className="text-sm text-muted-foreground">
                  No agents found.
                </p>
              </div>
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

        <div className="bg-background/40 flex h-[60vh] flex-col gap-3 overflow-y-auto p-4">
          {transcript.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
};
