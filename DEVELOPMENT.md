# Development

How to work on the agentcn registry locally and configure the live preview backend.

## Quick Start

Install a recipe into your Eve or Flue project:

```bash
# Eve
npx shadcn@latest add https://agentcn.sh/r/eve/competitor-intel

# Flue
npx shadcn@latest add https://agentcn.sh/r/flue/competitor-intel
```

To develop the registry itself:

```bash
pnpm install        # install dependencies
pnpm registry:build # build recipes into public/r/
pnpm dev            # start the docs site
```

Add or edit recipes under `registry/eve/<name>/` or `registry/flue/<name>/`, each with its own `registry.json`.

## Preview Backend

The docs ship a live `<AgentPreview>` for each recipe. The two frameworks are previewed differently:

- **Eve** preview requires a separately deployed Eve app. Deploy `registry/eve/competitor-intel` as an Eve project on Vercel, then set `EVE_PREVIEW_URL` to its origin. The preview route opens a durable session against `EVE_PREVIEW_URL/eve/v1/session`, attaches to the stream, and forwards the raw NDJSON events to the browser.
- **Flue** preview runs **in-process** in the Next.js API route (`app/api/preview/[framework]/[agent]/route.ts`). It mirrors the recipe against the Anthropic Messages API, so it only needs `ANTHROPIC_API_KEY` — no separate deployment.

Both routes are rate limited to 10 requests per IP per hour (in-memory, resets on restart). Copy `.env.local.example` to `.env.local` and fill in:

```bash
EVE_PREVIEW_URL=    # URL of your deployed Eve preview instance
ANTHROPIC_API_KEY=  # Anthropic API key for Flue in-process preview
```
