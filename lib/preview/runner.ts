/**
 * Generic in-process preview runner.
 *
 * Drives any catalogued agent with a single Anthropic Messages tool-use loop:
 * it sends the agent's system prompt and tool schemas, executes each requested
 * tool via the shared catalog (running real ones, degrading the rest), and
 * emits the structured preview event protocol the `AgentPreview` UI renders.
 */
import { getPreviewAgent } from "@/lib/preview/agents";
import type { EmitEvent } from "@/lib/preview/events";
import { getPreviewTool } from "@/lib/preview/tools";
import type { PreviewTool } from "@/lib/preview/tools";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOKENS = 1500;
const MAX_TURNS = 8;

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

interface ToolSchema {
  description: string;
  input_schema: unknown;
  name: string;
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

export const runPreview = async ({
  slug,
  input,
  emit,
  apiKey,
  signal,
}: {
  slug: string;
  input: Record<string, string>;
  emit: EmitEvent;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<void> => {
  const agent = getPreviewAgent(slug);
  if (!agent) {
    emit({ message: `No preview available for "${slug}".`, type: "error" });
    return;
  }

  const toolDefs = agent.tools
    .map(getPreviewTool)
    .filter(Boolean) as PreviewTool[];

  const tools: ToolSchema[] = toolDefs.map((tool) => ({
    description: tool.description,
    input_schema: tool.input_schema,
    name: tool.name,
  }));

  const messages: AnthropicMessage[] = [
    { content: agent.prompt(input), role: "user" },
  ];

  let finalText = "";

  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    if (signal?.aborted) {
      return;
    }

    const response = await callAnthropic(
      apiKey,
      agent.model,
      agent.system,
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

    // Stream any intermediate reasoning text before the tool calls.
    for (const block of response.content) {
      if (isTextBlock(block) && block.text.trim()) {
        emit({ text: block.text, type: "text:delta" });
      }
    }

    messages.push({ content: response.content, role: "assistant" });

    const toolResults: ContentBlock[] = [];
    for (const toolUse of toolUses) {
      emit({ input: toolUse.input, tool: toolUse.name, type: "tool:call" });

      const tool = getPreviewTool(toolUse.name);
      let result: unknown;
      try {
        result = tool
          ? await tool.execute(toolUse.input)
          : { error: `Unknown tool "${toolUse.name}".` };
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : "Tool failed.",
        };
      }

      emit({ tool: toolUse.name, type: "tool:result" });
      toolResults.push({
        content: JSON.stringify(result).slice(0, 8000),
        tool_use_id: toolUse.id,
        type: "tool_result",
      } as ContentBlock);
    }

    messages.push({ content: toolResults, role: "user" });
  }

  emit({ result: finalText || "(no final answer produced)", type: "done" });
};
