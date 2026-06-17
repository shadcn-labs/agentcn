/**
 * In-process runner for the Flue `competitor-intel` recipe preview.
 *
 * The published recipe (`registry/flue/competitor-intel`) runs on the Flue
 * runtime, which is not installed in this site and uses Flue-specific module
 * syntax that Next.js cannot bundle. For the live preview we mirror the recipe
 * faithfully in-process against the Anthropic Messages API (no extra
 * dependencies): the orchestrator delegates each URL to an `analyst` subagent,
 * scrapes the page with the same `scrape_url` tool, then synthesizes a
 * structured report — emitting the structured preview event protocol as it goes.
 */
import type { EmitEvent } from "@/lib/preview/events";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// The recipe orchestrator model, mapped to its bare Anthropic API id.
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;
const MAX_TURNS = 12;
const SCRAPE_CHAR_LIMIT = 6000;

const SYSTEM_PROMPT = `You are a competitive intelligence orchestrator.
For each competitor URL provided, delegate analysis to the analyst subagent.
Use the scrape_url tool to fetch each page, then extract positioning, pricing, and
key features. Only report what was found on the page — do not hallucinate. Note
gaps where information was unavailable. When every URL has been analyzed, write a
concise final summary.`;

const SCRAPE_TOOL = {
  description: "Scrapes a URL and returns the page content as markdown.",
  input_schema: {
    properties: { url: { type: "string" as const } },
    required: ["url"],
    type: "object" as const,
  },
  name: "scrape_url",
};

interface TextBlock {
  type: "text";
  text: string;
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock = TextBlock | ToolUseBlock | { type: string };

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

const isTextBlock = (block: ContentBlock): block is TextBlock =>
  block.type === "text";

const isToolUseBlock = (block: ContentBlock): block is ToolUseBlock =>
  block.type === "tool_use";

const callAnthropic = async (
  apiKey: string,
  messages: AnthropicMessage[]
): Promise<MessagesResponse> => {
  const res = await fetch(ANTHROPIC_API_URL, {
    body: JSON.stringify({
      max_tokens: MAX_TOKENS,
      messages,
      model: MODEL,
      system: SYSTEM_PROMPT,
      tools: [SCRAPE_TOOL],
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

const scrape = async (url: string): Promise<string> => {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`);
    const text = await res.text();
    return text.slice(0, SCRAPE_CHAR_LIMIT);
  } catch (error) {
    return `Failed to scrape ${url}: ${error instanceof Error ? error.message : "unknown error"}`;
  }
};

const extractJson = (text: string): unknown => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const runCompetitorIntel = async ({
  urls,
  emit,
  apiKey,
  signal,
}: {
  urls: string[];
  emit: EmitEvent;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<void> => {
  const messages: AnthropicMessage[] = [
    {
      content: `Analyze these competitors: ${urls.join(", ")}`,
      role: "user",
    },
  ];

  let finalText = "";

  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    if (signal?.aborted) {
      return;
    }

    const response = await callAnthropic(apiKey, messages);

    for (const block of response.content) {
      if (isTextBlock(block) && block.text.trim()) {
        emit({ text: block.text, type: "text:delta" });
        finalText = block.text;
      }
    }

    const toolUses = response.content.filter(isToolUseBlock);

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      break;
    }

    messages.push({ content: response.content, role: "assistant" });

    const toolResults: ContentBlock[] = [];
    for (const toolUse of toolUses) {
      const { input } = toolUse;
      // The orchestrator delegates each page to the analyst subagent.
      emit({ agent: "analyst", type: "subagent:dispatch" });
      emit({ input, tool: toolUse.name, type: "tool:call" });

      const url = typeof input.url === "string" ? input.url : "";
      const content = url ? await scrape(url) : "No URL provided.";

      emit({ tool: toolUse.name, type: "tool:result" });
      toolResults.push({
        content,
        tool_use_id: toolUse.id,
        type: "tool_result",
      } as ContentBlock);
    }

    messages.push({ content: toolResults, role: "user" });
  }

  // Synthesize the structured report the recipe returns.
  emit({ agent: "synthesizer", type: "subagent:dispatch" });
  messages.push({
    content: `Return ONLY a JSON object (no prose, no code fences) with this exact shape:
{"competitors":[{"url":"","positioning":"","pricing":"","keyFeatures":[""]}],"summary":""}`,
    role: "user",
  });

  const synthesis = await callAnthropic(apiKey, messages);
  const synthesisText = synthesis.content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("");

  const result = extractJson(synthesisText) ?? {
    competitors: [],
    summary: finalText || synthesisText,
  };

  emit({ result, type: "done" });
};
