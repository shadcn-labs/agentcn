"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { publishAgent } from "@/lib/community/publish";
import { SUGGESTED_TAGS } from "@/lib/community/types";
import type { Framework } from "@/lib/community/types";

interface FileDraft {
  path: string;
  content: string;
}

const DEFAULT_FILES: FileDraft[] = [
  { content: "", path: "agent/agent.ts" },
  { content: "", path: "agent/instructions.md" },
];

export const PublishForm = () => {
  const router = useRouter();
  const [framework, setFramework] = useState<Framework>("eve");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<FileDraft[]>(DEFAULT_FILES);
  const [submitting, setSubmitting] = useState(false);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const updateFile = (index: number, patch: Partial<FileDraft>) => {
    setFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, ...patch } : file))
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const cleanFiles = files
      .map((file) => ({ ...file, path: file.path.trim() }))
      .filter((file) => file.path && file.content.trim());

    if (cleanFiles.length === 0) {
      toast.error("Add at least one file with content.");
      return;
    }

    setSubmitting(true);
    const result = await publishAgent({
      dependencies: [framework],
      description,
      files: cleanFiles.map((file) => ({
        content: file.content,
        path: file.path,
        type: "registry:file",
      })),
      framework,
      tags,
      title,
    });
    setSubmitting(false);

    if (result.ok) {
      toast.success("Agent published!");
      router.push(`/community/${result.code}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="framework">
          Framework
        </label>
        <NativeSelect
          id="framework"
          value={framework}
          onChange={(event) => setFramework(event.target.value as Framework)}
          className="max-w-48"
        >
          <NativeSelectOption value="eve">Eve</NativeSelectOption>
          <NativeSelectOption value="flue">Flue</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <Input
          id="title"
          required
          maxLength={80}
          placeholder="Weather Agent"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <Textarea
          id="description"
          required
          maxLength={300}
          placeholder="What does this agent do?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium">Tags</span>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
                <button
                  type="button"
                  className="ml-1 opacity-60 hover:opacity-100"
                  onClick={() =>
                    setTags((prev) => prev.filter((t) => t !== tag))
                  }
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          placeholder="Type a tag and press Enter"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag(tagInput);
            }
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md border px-2 py-0.5 text-xs transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Files</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            sound="click"
            onClick={() =>
              setFiles((prev) => [...prev, { content: "", path: "" }])
            }
          >
            <Plus />
            Add file
          </Button>
        </div>
        {files.map((file, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: files are positional drafts
          <div key={index} className="grid gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="agent/agent.ts"
                value={file.path}
                onChange={(event) =>
                  updateFile(index, { path: event.target.value })
                }
                className="font-mono text-xs"
              />
              {files.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  sound="click"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label="Remove file"
                >
                  <Trash2 />
                </Button>
              )}
            </div>
            <Textarea
              placeholder="// file contents"
              value={file.content}
              onChange={(event) =>
                updateFile(index, { content: event.target.value })
              }
              className="min-h-32 font-mono text-xs"
            />
          </div>
        ))}
      </div>

      <div>
        <Button type="submit" disabled={submitting} sound="success">
          {submitting ? "Publishing…" : "Publish agent"}
        </Button>
      </div>
    </form>
  );
};
