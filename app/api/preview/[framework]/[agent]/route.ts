import type { EmitEvent, PreviewEvent } from "@/lib/preview/events";
import { runCompetitorIntel } from "@/lib/preview/flue-runner";

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

const toUrls = (input: Record<string, string>): string[] =>
  Object.values(input)
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** Streams the in-process Flue runner as structured preview events. */
const flueStream = (urls: string[]): ReadableStream<Uint8Array> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit: EmitEvent = (event) => {
        controller.enqueue(sseFrame(JSON.stringify(event)));
      };

      try {
        if (!apiKey) {
          emit({
            message:
              "ANTHROPIC_API_KEY is not set. Add it to .env.local to run the Flue preview in-process.",
            type: "error",
          });
          return;
        }
        if (urls.length === 0) {
          emit({
            message: "Provide at least one competitor URL.",
            type: "error",
          });
          return;
        }

        await runCompetitorIntel({ apiKey, emit, urls });
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
};

/**
 * Proxies a durable Eve session: opens the session, attaches to its NDJSON
 * stream, and forwards each raw event to the browser as a Server-Sent Event.
 */
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
              // Forward each raw NDJSON event line as an SSE frame.
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

  if (framework === "flue") {
    if (agent !== "competitor-intel") {
      return Response.json(
        { error: `No in-process Flue preview for "${agent}".` },
        { status: 404 }
      );
    }
    return new Response(flueStream(toUrls(input)), { headers: SSE_HEADERS });
  }

  const message = Object.values(input).join("\n\n").trim();
  return new Response(eveStream(message), { headers: SSE_HEADERS });
};
