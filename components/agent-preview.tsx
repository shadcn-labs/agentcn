"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PreviewArtifact } from "@/lib/preview/events";
import { cn } from "@/lib/utils";

interface InputField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "url-list";
}

interface AgentPreviewProps {
  agent: string;
  framework: "eve" | "flue";
  inputFields: InputField[];
}

type LogEntry =
  | { kind: "tool:call"; tool: string; input: string }
  | { kind: "tool:result"; tool: string }
  | { kind: "subagent:dispatch"; agent: string }
  | { kind: "text"; text: string }
  | { kind: "done"; result: string }
  | { kind: "artifacts"; tabs: PreviewArtifact[] }
  | { kind: "error"; message: string }
  | { kind: "raw"; text: string };

const truncate = (value: unknown, max = 80): string => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) {
    return "";
  }
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const formatResult = (result: unknown): string => {
  if (result && typeof result === "object") {
    return JSON.stringify(result, null, 2);
  }
  return String(result);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const ArtifactTabs = ({ tabs }: { tabs: PreviewArtifact[] }) => {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  if (!current) {
    return null;
  }

  return (
    <div className="text-foreground">
      <p className="mb-2 text-green-600 dark:text-green-400">✓ completed</p>
      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((tab) => {
          const isActive = tab.id === current.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "-mb-px border-b-2 px-2.5 py-1.5 text-left transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="font-medium">{tab.label}</span>{" "}
              <span className="text-[0.65rem] text-muted-foreground/70 uppercase">
                {tab.hint}
              </span>
            </button>
          );
        })}
      </div>
      <div className="relative mt-2">
        <CopyButton value={current.content} />
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap pr-9">
          {current.content}
        </pre>
      </div>
    </div>
  );
};

const LogLine = ({ entry }: { entry: LogEntry }) => {
  switch (entry.kind) {
    case "tool:call": {
      return (
        <p className="text-blue-500 dark:text-blue-400">
          ⚙ {entry.tool}{" "}
          <span className="text-muted-foreground">{entry.input}</span>
        </p>
      );
    }
    case "tool:result": {
      return (
        <p className="text-green-600 dark:text-green-400">✓ {entry.tool}</p>
      );
    }
    case "subagent:dispatch": {
      return (
        <p className="text-purple-600 dark:text-purple-400">⇢ {entry.agent}</p>
      );
    }
    case "text": {
      return (
        <p className="whitespace-pre-wrap text-foreground">{entry.text}</p>
      );
    }
    case "done": {
      return (
        <div className="text-green-600 dark:text-green-400">
          <p>✓ completed</p>
          <pre className="mt-1 whitespace-pre-wrap text-foreground">
            {entry.result}
          </pre>
        </div>
      );
    }
    case "artifacts": {
      return <ArtifactTabs tabs={entry.tabs} />;
    }
    case "error": {
      return (
        <p className="text-red-600 dark:text-red-400">✗ {entry.message}</p>
      );
    }
    default: {
      return <p className="text-muted-foreground/80">{entry.text}</p>;
    }
  }
};

export const AgentPreview = ({
  agent,
  framework,
  inputFields,
}: AgentPreviewProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasEmptyInput = useMemo(
    () => inputFields.some((field) => !values[field.name]?.trim()),
    [inputFields, values]
  );

  const append = useCallback((entry: LogEntry) => {
    setLog((current) => {
      if (entry.kind === "text") {
        const last = current.at(-1);
        if (last?.kind === "text") {
          return [
            ...current.slice(0, -1),
            { kind: "text", text: last.text + entry.text },
          ];
        }
      }
      return [...current, entry];
    });
  }, []);

  const handleEvent = useCallback(
    (raw: string) => {
      let event: unknown;
      try {
        event = JSON.parse(raw);
      } catch {
        append({ kind: "raw", text: raw });
        return;
      }

      if (!isRecord(event) || typeof event.type !== "string") {
        append({ kind: "raw", text: raw });
        return;
      }

      switch (event.type) {
        case "tool:call": {
          append({
            input: truncate(event.input),
            kind: "tool:call",
            tool: String(event.tool ?? "tool"),
          });
          break;
        }
        case "tool:result": {
          append({ kind: "tool:result", tool: String(event.tool ?? "tool") });
          break;
        }
        case "subagent:dispatch": {
          append({
            agent: String(event.agent ?? "agent"),
            kind: "subagent:dispatch",
          });
          break;
        }
        case "text:delta": {
          append({ kind: "text", text: String(event.text ?? "") });
          break;
        }
        case "done": {
          append({ kind: "done", result: formatResult(event.result) });
          break;
        }
        case "artifacts": {
          append({
            kind: "artifacts",
            tabs: Array.isArray(event.tabs)
              ? (event.tabs as PreviewArtifact[])
              : [],
          });
          break;
        }
        case "error": {
          append({ kind: "error", message: String(event.message ?? "Error") });
          break;
        }
        default: {
          append({
            kind: "raw",
            text: typeof event.text === "string" ? event.text : raw,
          });
        }
      }
    },
    [append]
  );

  const run = useCallback(async () => {
    setRunning(true);
    setLog([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/preview/${framework}/${agent}`, {
        body: JSON.stringify({ input: values }),
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });

      if (response.status === 429) {
        append({
          kind: "error",
          message: "Rate limit exceeded. Try again later.",
        });
        return;
      }
      if (!response.ok || !response.body) {
        append({
          kind: "error",
          message: `Request failed (${response.status}).`,
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.replace(/^data:\s?/, "").trim();
          if (line) {
            handleEvent(line);
          }
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        append({
          kind: "error",
          message: error instanceof Error ? error.message : "Unknown error.",
        });
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [agent, append, framework, handleEvent, values]);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-4 border-b p-4">
        <div className="flex flex-col gap-3">
          {inputFields.map((field) => (
            <label key={field.name} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {field.label}
              </span>
              {field.type === "text" ? (
                <Input
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              ) : (
                <textarea
                  className={cn(
                    "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                  )}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              )}
              {field.type === "url-list" ? (
                <span className="text-xs text-muted-foreground/70">
                  One URL per line.
                </span>
              ) : null}
            </label>
          ))}
        </div>

        <Button
          className="w-fit"
          disabled={running || hasEmptyInput}
          onClick={run}
          sound="click"
        >
          {running ? "Running…" : "Run agent"}
        </Button>
      </div>

      <div className="bg-code text-code-foreground max-h-96 min-h-32 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {log.length === 0 && !running ? (
          <p className="text-muted-foreground/60">
            Output will stream here when you run the agent.
          </p>
        ) : null}

        {log.map((entry, index) => (
          <LogLine entry={entry} key={index} />
        ))}

        {running ? (
          <span className="inline-block animate-pulse text-foreground">▋</span>
        ) : null}
      </div>
    </div>
  );
};
