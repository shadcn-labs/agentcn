/** In-process preview runner. */
import { getPreviewAgent } from "@/lib/preview/agents";
import {
  buildTokenArtifacts,
  fetchDesignSignals,
  generateDesignMd,
} from "@/lib/preview/design-md/compose";
import type { EmitEvent } from "@/lib/preview/events";
import { getPreviewTool } from "@/lib/preview/tools";
import type { PreviewTool } from "@/lib/preview/tools";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOKENS = 1500;
const MAX_TURNS = 8;
const TOOL_RESULT_LIMIT = 8000;

interface ToolSchema {
  description: string;
  input_schema: unknown;
  name: string;
}

const executeTool = async (
  name: string,
  input: Record<string, unknown>
): Promise<unknown> => {
  const tool = getPreviewTool(name);
  if (!tool) {
    return { error: `Unknown tool "${name}".` };
  }
  try {
    return await tool.execute(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tool failed." };
  }
};

interface TextBlock {
  text: string;
  type: "text";
}

interface ToolUseBlock {
  id: string;
  input: Record<string, unknown>;
  name: string;
  type: "tool_use";
}

type ContentBlock = TextBlock | ToolUseBlock | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

interface AnthropicMessage {
  content: string | ContentBlock[];
  role: "assistant" | "user";
}

const isTextBlock = (block: ContentBlock): block is TextBlock =>
  block.type === "text";

const isToolUseBlock = (block: ContentBlock): block is ToolUseBlock =>
  block.type === "tool_use";

const callAnthropic = async (
  apiKey: string,
  model: string,
  system: string,
  tools: ToolSchema[],
  messages: AnthropicMessage[]
): Promise<MessagesResponse> => {
  const res = await fetch(ANTHROPIC_API_URL, {
    body: JSON.stringify({
      max_tokens: MAX_TOKENS,
      messages,
      model,
      system,
      tools,
    }),
    headers: {
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    method: "POST",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Anthropic API error (${res.status}): ${detail.slice(0, 300)}`
    );
  }

  return (await res.json()) as MessagesResponse;
};

const runAnthropicLoop = async ({
  apiKey,
  model,
  system,
  tools,
  firstMessage,
  emit,
  signal,
}: {
  apiKey: string;
  model: string;
  system: string;
  tools: ToolSchema[];
  firstMessage: string;
  emit: EmitEvent;
  signal?: AbortSignal;
}): Promise<void> => {
  const messages: AnthropicMessage[] = [
    { content: firstMessage, role: "user" },
  ];
  let finalText = "";

  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    if (signal?.aborted) {
      return;
    }

    const response = await callAnthropic(
      apiKey,
      model,
      system,
      tools,
      messages
    );
    const toolUses = response.content.filter(isToolUseBlock);

    if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
      finalText = response.content
        .filter(isTextBlock)
        .map((block) => block.text)
        .join("");
      break;
    }

    for (const block of response.content) {
      if (isTextBlock(block) && block.text.trim()) {
        emit({ text: block.text, type: "text:delta" });
      }
    }

    messages.push({ content: response.content, role: "assistant" });

    const toolResults: ContentBlock[] = [];
    for (const toolUse of toolUses) {
      emit({ input: toolUse.input, tool: toolUse.name, type: "tool:call" });
      const result = await executeTool(toolUse.name, toolUse.input);
      emit({ tool: toolUse.name, type: "tool:result" });
      toolResults.push({
        content: JSON.stringify(result).slice(0, TOOL_RESULT_LIMIT),
        tool_use_id: toolUse.id,
        type: "tool_result",
      } as ContentBlock);
    }

    messages.push({ content: toolResults, role: "user" });
  }

  emit({ result: finalText || "(no final answer produced)", type: "done" });
};

const runDesignMdPreview = async (
  input: Record<string, string>,
  emit: EmitEvent,
  signal?: AbortSignal
): Promise<void> => {
  const contextKey = process.env.CONTEXT_DEV_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!contextKey) {
    emit({
      message:
        "CONTEXT_DEV_API_KEY is not set. Add it to .env.local to fetch the styleguide, screenshot, and Markdown.",
      type: "error",
    });
    return;
  }
  if (!anthropicKey) {
    emit({
      message:
        "ANTHROPIC_API_KEY is not set. Add it to .env.local to compose the DESIGN.md.",
      type: "error",
    });
    return;
  }

  const domain = Object.values(input)
    .join(" ")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (!domain) {
    emit({
      message: "Enter a domain to extract a DESIGN.md from.",
      type: "error",
    });
    return;
  }

  const signals = await fetchDesignSignals(domain, contextKey, {
    onSignalDone: (tool) => emit({ tool, type: "tool:result" }),
    onSignalStart: (tool, toolInput) =>
      emit({ input: toolInput, tool, type: "tool:call" }),
  });

  if (signal?.aborted) {
    return;
  }

  const designMd = await generateDesignMd(domain, signals, anthropicKey);
  const { tailwind, css } = buildTokenArtifacts(domain, signals);

  emit({
    tabs: [
      {
        content: designMd || "(no DESIGN.md produced)",
        hint: "raw markdown",
        id: "design",
        label: "DESIGN.md",
      },
      {
        content: tailwind,
        hint: "@theme block",
        id: "tailwind",
        label: "Tailwind v4",
      },
      { content: css, hint: ":root tokens", id: "css", label: "CSS variables" },
    ],
    type: "artifacts",
  });
};

export const runPreview = async ({
  slug,
  input,
  emit,
  signal,
}: {
  slug: string;
  input: Record<string, string>;
  emit: EmitEvent;
  signal?: AbortSignal;
}): Promise<void> => {
  if (slug === "extract-design-md") {
    await runDesignMdPreview(input, emit, signal);
    return;
  }

  const agent = getPreviewAgent(slug);
  if (!agent) {
    emit({ message: `No preview available for "${slug}".`, type: "error" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    emit({
      message:
        "ANTHROPIC_API_KEY is not set. Add it to .env.local to run the live preview in-process.",
      type: "error",
    });
    return;
  }

  const tools: ToolSchema[] = (
    agent.tools.map(getPreviewTool).filter(Boolean) as PreviewTool[]
  ).map((tool) => ({
    description: tool.description,
    input_schema: tool.input_schema,
    name: tool.name,
  }));

  await runAnthropicLoop({
    apiKey,
    emit,
    firstMessage: agent.prompt(input),
    model: agent.model,
    signal,
    system: agent.system,
    tools,
  });
};
