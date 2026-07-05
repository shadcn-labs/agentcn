# Development

How to work on the agentcn registry locally and configure the live preview backend.

## Quick Start

Install a recipe into your Eve, Flue, or Mastra project:

```bash
# Eve
npx shadcn@latest add @agentcn/eve/deep-search

# Flue
npx shadcn@latest add @agentcn/flue/deep-search

# Mastra
npx shadcn@latest add @agentcn/mastra/deep-search
```

To develop the registry itself:

```bash
pnpm install        # install dependencies
pnpm registry:build # build recipes into public/r/
pnpm dev            # start the docs site
```

Add or edit recipes under `registry/eve/<name>/`, `registry/flue/<name>/`, or `registry/mastra/<name>/`, each with its own `registry.json`.

## Preview Backend

The docs ship a live `<AgentPreview>` for each recipe. The three frameworks are previewed differently:

- **Eve** preview requires a separately deployed Eve app. Deploy a recipe (e.g. `registry/eve/deep-search`) as an Eve project on Vercel, then set `EVE_PREVIEW_URL` to its origin. The preview route opens a durable session against `EVE_PREVIEW_URL/eve/v1/session`, attaches to the stream, and forwards the raw NDJSON events to the browser.
- **Flue** preview has no in-process runner bundled. The route (`app/api/preview/[framework]/[agent]/route.ts`) returns a 404 for Flue agents until you add a recipe-specific runner that mirrors the recipe against the Anthropic Messages API (needing only `ANTHROPIC_API_KEY`).
- **Mastra** preview follows the same pattern as Flue — returns a 404 until a recipe-specific runner is added.

Both routes are rate limited to 10 requests per IP per hour (in-memory, resets on restart). Copy `.env.local.example` to `.env.local` and fill in:

```bash
EVE_PREVIEW_URL=    # URL of your deployed Eve preview instance
ANTHROPIC_API_KEY=  # Anthropic API key for Flue in-process preview
```
