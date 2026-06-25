import type { EmitEvent, PreviewEvent } from "@/lib/preview/events";
import { runPreview } from "@/lib/preview/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

const FRAMEWORKS = new Set(["eve", "flue"]);

// In-memory rate limit: 10 requests per IP per hour. Resets on server restart.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);
  return false;
};

const SSE_HEADERS = {
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
  "content-type": "text/event-stream",
};

const sseFrame = (payload: string): Uint8Array =>
  new TextEncoder().encode(`data: ${payload}\n\n`);

const eveStream = (message: string): ReadableStream<Uint8Array> => {
  const baseUrl = process.env.EVE_PREVIEW_URL;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emitError = (errorMessage: string) => {
        const event: PreviewEvent = { message: errorMessage, type: "error" };
        controller.enqueue(sseFrame(JSON.stringify(event)));
      };

      try {
        if (!baseUrl) {
          emitError(
            "EVE_PREVIEW_URL is not set. Deploy the Eve recipe and point this variable at it."
          );
          return;
        }

        const sessionRes = await fetch(`${baseUrl}/eve/v1/session`, {
          body: JSON.stringify({ message }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });

        if (!sessionRes.ok) {
          emitError(`Eve session failed (${sessionRes.status}).`);
          return;
        }

        const sessionId = sessionRes.headers.get("x-eve-session-id");
        if (!sessionId) {
          emitError("Eve session did not return a session id.");
          return;
        }

        const streamRes = await fetch(
          `${baseUrl}/eve/v1/session/${sessionId}/stream`
        );
        if (!streamRes.ok || !streamRes.body) {
          emitError(`Eve stream failed (${streamRes.status}).`);
          return;
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              controller.enqueue(sseFrame(trimmed));
            }
          }
        }

        if (buffer.trim()) {
          controller.enqueue(sseFrame(buffer.trim()));
        }
      } catch (error) {
        emitError(error instanceof Error ? error.message : "Unknown error.");
      } finally {
        controller.close();
      }
    },
  });
};

const genericStream = (
  slug: string,
  input: Record<string, string>
): ReadableStream<Uint8Array> =>
  new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit: EmitEvent = (event) => {
        controller.enqueue(sseFrame(JSON.stringify(event)));
      };

      try {
        await runPreview({ emit, input, slug });
      } catch (error) {
        emit({
          message: error instanceof Error ? error.message : "Unknown error.",
          type: "error",
        });
      } finally {
        controller.close();
      }
    },
  });

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ framework: string; agent: string }> }
): Promise<Response> => {
  const { framework, agent } = await params;

  if (!FRAMEWORKS.has(framework)) {
    return Response.json({ error: "Unknown framework." }, { status: 404 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let input: Record<string, string> = {};
  try {
    const body = (await request.json()) as { input?: Record<string, string> };
    input = body.input ?? {};
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (framework === "eve" && process.env.EVE_PREVIEW_URL) {
    const message = Object.values(input).join("\n\n").trim();
    return new Response(eveStream(message), { headers: SSE_HEADERS });
  }

  return new Response(genericStream(agent, input), { headers: SSE_HEADERS });
};
