---
name: mastra-file-agents
description: >-
  Migrate Mastra code-based agents (agents built with new Agent(...) and registered
  in a Mastra({ agents }) map) to the file-based convention: one directory per agent
  under src/mastra/agents. Use when the user wants to convert or refactor Mastra
  agents to the per-directory convention, mentions Mastra "file-based agents" or
  agentConfig, or wants to split a big src/mastra/index.ts or agents.ts into one
  folder per agent — even if they do not name this skill. Requires @mastra/core 1.48+.
compatibility: A Mastra project using @mastra/core >= 1.48.0. Agents must run through the Mastra CLI (mastra dev / mastra build) for file-based discovery.
---

# Migrate Mastra agents to file-based

Convert agents built in code with `new Agent({...})` and registered in a
`new Mastra({ agents: {...} })` map into the file-based convention: one directory
per agent under `src/mastra/agents/<name>/`, where sibling files supply what used to
be constructor options.

This is a **behavior-preserving refactor**, not a redesign. Move each option to the
file that owns it, keep the same model, instructions, tools, memory, skills, and
subagents, and don't invent config the agent didn't have.

## Two things that break migrations

**1. File-based agents are discovered ONLY by the Mastra bundler** (`mastra dev` /
`mastra build`). If the app imports the `mastra` instance directly (Mastra used as a
library, a custom server, tests that `import { mastra }`), `agents/<name>/`
directories are never discovered and the agent silently disappears. Before migrating,
confirm how the app runs: through the CLI → migrate freely; imported directly → **do
not migrate that agent**, keep it in code and tell the user why.

**2. Code wins on name collisions.** If an agent exists in both a `config.ts`
directory and the `Mastra({ agents })` map, the code one is kept and the file-based
one is ignored (with a warning). The migration is a **no-op until you remove the code
registration** (Step 5). Half-migrating changes nothing.

## Workflow

Work one agent at a time. Copy this checklist and track it:

```
Migration progress for <agent>:
- [ ] Confirmed the app runs via mastra dev/build (not a direct import)
- [ ] Created src/mastra/agents/<name>/
- [ ] config.ts (agentConfig) with model + non-instruction/tool config
- [ ] instructions.md OR dynamic instructions kept in config.ts
- [ ] tools/*.ts (one default export each, filename = tool key)
- [ ] memory.ts / workspace.ts / skills/ / subagents/ if present (see references/mapping.md)
- [ ] Removed the agent from the Mastra({ agents }) map
- [ ] Deleted now-dead imports / the old agent file if nothing else uses it
- [ ] Verified with mastra dev
```

### Step 1: Find the code-based agents

Locate every `new Agent({...})` and how it is registered. Usually the registration
is in `src/mastra/index.ts` inside `new Mastra({ agents: { ... } })`, but agents
may be defined in separate files (`src/mastra/agents/*.ts`, a big `agents.ts`) and
imported. Read the full `Agent` config for each — you need every option to map it
faithfully. Note the **key** used in the `agents` map — that key is how the agent is
registered and looked up (e.g. `mastra.getAgent('weather')`, Studio, client SDK),
and it becomes the directory name.

### Step 2: Create the directory and split the config

For an agent registered as `agents: { weather: weatherAgent }`, create
`src/mastra/agents/weather/`.

**Name the directory after the map key, not the `id`.** The directory name becomes
the agent's registration/lookup key, so using the map key preserves every existing
`getAgent(...)` call and client reference. This matters when the map key differs
from the `id` — e.g. `agents: { browserAgent }` where `new Agent({ id: 'browser-agent' })`.
Name the folder `browserAgent` (the key), and because `id`/`name` would otherwise
default to `browserAgent`, set them **explicitly** in `config.ts` to keep the
original `'browser-agent'` / `'Browser Agent'`. If the map key and `id` already
match, `id`/`name` default to the folder and you can drop them.

**config.ts** — everything except instructions and tools that were passed inline.
Use `agentConfig()` so the partial is typed and sibling files fill the rest:

```typescript
import { agentConfig } from '@mastra/core/agent'

export default agentConfig({
  model: 'openai/gpt-5.5',
  // instructions omitted -> taken from instructions.md
  // tools omitted -> taken from tools/*.ts
})
```

`model` is required — a missing model fails the build and names the directory.

**instructions.md** — if the original `instructions` was a **string** (or array of
static strings/messages), move the text into `instructions.md` and omit
`instructions` from config.ts. `instructions.md` wins over a static `instructions`
string, so leaving both is redundant.

If the original `instructions` was a **function** (dynamic instructions that read
runtime context), it CANNOT live in `instructions.md`. Keep it in `config.ts` —
dynamic function instructions win over `instructions.md`. See `references/mapping.md`.

### Step 3: Split out the tools

Each tool becomes its own file under `tools/`, default-exporting the
`createTool()` call. **The filename becomes the tool key**, so name the file after
the key used in the original `tools` map (or the tool's `id`). If the original was
`tools: { get_weather: getWeatherTool }`, the file must be `tools/get_weather.ts`.

```typescript
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export default createTool({
  id: 'get_weather',
  description: 'Get the current weather for a city',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ context }) => ({ city: context.city, tempC: 21 }),
})
```

Tools from `tools/*.ts` merge with any `config.tools`. On a key collision
`config.tools` wins (with a warning), so don't list a tool in both places. If
`config.tools` is a **function**, discovered tool files are ignored — in that case
keep tools in config.ts and say so. Test files (`*.test.ts`, `*.spec.ts`, etc.)
are ignored by discovery.

**Not every tool is a `createTool()`.** Provider-native tools (e.g.
`openai.tools.webSearch({})`) and other pre-built tool objects don't fit the
`createTool()` shape. Either leave them inline in `config.tools`, or default-export
the tool object from a `tools/<key>.ts` file — both are discovered. When in doubt,
keeping a provider tool in `config.tools` is the simplest faithful move. Reserve
`tools/*.ts` files for the project's own `createTool()` definitions.

If a tool is shared by multiple agents, don't force it into one agent's `tools/`.
Keep the shared tool in a common module and reference it from `config.tools`, or
duplicate deliberately. Note the choice for the user.

### Step 4: Handle the remaining surfaces

Memory, workspace, skills, and subagents each have their own file/directory and
precedence rules. When the agent you're migrating uses any of them, read
[references/mapping.md](references/mapping.md) for the exact mapping and gotchas
(dynamic-config caveats, subagent `description` requirement, seed files, etc.).
Do not drop these during migration — losing an agent's memory or subagent silently
changes behavior.

### Step 5: Remove the code registration

This is what completes the migration (gotcha 2). Delete the agent's entry from the
`Mastra({ agents: {...} })` map, then remove imports and definitions that are now
unused — if the old `new Agent(...)` lived in its own file and nothing else imports
it, delete that file.

Leave code-registered any agent that must stay in code: direct-import/library usage,
programmatic or dynamic registration, or a shared instance imported elsewhere. Both
styles coexist fine.

### Step 6: Verify

Run the app through the CLI so the bundler discovers the new directories:

```bash
npx mastra dev
```

`npx mastra build` is a good non-interactive check when you can't start the dev
server — it runs the same discovery and fails loudly on missing models, missing
subagent descriptions, or unresolved directories. If dependencies aren't installed
in your environment, say so and mark verification as structural only rather than
claiming it runs.

Confirm each migrated agent still appears (under its original registration key) and
responds, and that no "code agent overrides file-based" or "config.X wins" warnings
are logged (those signal a leftover collision or a redundant config entry). Fix
warnings before calling it done.

## Mapping cheat sheet

| `new Agent({...})` option | File-based location |
| --- | --- |
| agents map key | Directory name (preserves registration/lookup key) |
| `id` / `name` | Default to directory name; set explicitly in `config.ts` when they differ from the folder |
| `model` | `config.ts` (required) |
| `instructions` (string/array) | `instructions.md` |
| `instructions` (function) | keep in `config.ts` |
| `description` | `config.ts` (required for subagents) |
| `tools: { key: createTool(...) }` | `tools/<key>.ts` (default export) |
| provider/pre-built tools (e.g. `openai.tools.*`) | keep in `config.tools`, or default-export from `tools/<key>.ts` |
| `skills` | `skills/` (see references/mapping.md) |
| `memory` | `memory.ts` (see references/mapping.md) |
| `workspace` | `workspace.ts` + `workspace/` seed files |
| delegated agents (`agents`) | `subagents/<childId>/` |
| everything else | `config.ts` via `agentConfig()` |
