"use client";

import { AgentInterface, openAIAdapter } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

const OpenuiAssistantPreview = () => {
  const llm = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      send: async (params: any) => {
        const lastMessage = params.messages.at(-1);
        const content =
          typeof lastMessage?.content === "string" ? lastMessage.content : "";

        const response = await fetch("/api/preview/eve/openui-assistant", {
          body: JSON.stringify({
            input: { message: content },
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: params.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Preview request failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const stream = new ReadableStream({
          async start(controller) {
            try {
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
                  if (line && line !== "[DONE]") {
                    try {
                      const event = JSON.parse(line);
                      if (event.type === "text:delta" && event.text) {
                        controller.enqueue(
                          new TextEncoder().encode(
                            `data: ${JSON.stringify({ delta: event.text, type: "TEXT_MESSAGE_CONTENT" })}\n\n`
                          )
                        );
                      } else if (event.type === "done" && event.result) {
                        controller.enqueue(
                          new TextEncoder().encode(
                            `data: ${JSON.stringify({ delta: event.result, type: "TEXT_MESSAGE_CONTENT" })}\n\n`
                          )
                        );
                        controller.enqueue(
                          new TextEncoder().encode("data: [DONE]\n\n")
                        );
                      }
                    } catch {
                      // skip parse errors
                    }
                  }
                }
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
      streamProtocol: openAIAdapter(),
    }),
    []
  );

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border bg-card">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI Assistant"
        theme={{ mode: "light" }}
        starterVariant="short"
        starters={[
          {
            displayText: "What time is it?",
            prompt: "What time is it in Tokyo?",
          },
          {
            displayText: "Show me a chart",
            prompt: "Create a bar chart showing monthly revenue.",
          },
        ]}
      />
    </div>
  );
};

export default OpenuiAssistantPreview;
