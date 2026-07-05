# Full surface mapping and precedence rules

Read this when the agent you're migrating uses memory, a workspace, skills, or
subagents, or when `config.ts` uses **functions** for `instructions`, `tools`,
`skills`, or `agents`. The core workflow (config/instructions/tools) lives in
SKILL.md; this file covers the rest and the precedence traps that silently drop
behavior during a migration.

## Contents

- [Instructions (string vs function)](#instructions)
- [Memory](#memory)
- [Skills](#skills)
- [Workspace and seed files](#workspace)
- [Subagents](#subagents)
- [Precedence rules reference](#precedence)
- [Common migration mistakes](#mistakes)

<a id="instructions"></a>
## Instructions

- **String / array of strings / system-message objects** → move the text into
  `instructions.md`. Omit `instructions` from `config.ts`. `instructions.md` wins
  over a static `instructions` string.
- **Function** (`instructions: ({ runtimeContext }) => ...`) → keep it in
  `config.ts`. A function cannot be expressed in `instructions.md`, and dynamic
  function instructions win over `instructions.md` anyway.
- If neither an `instructions.md` nor an `instructions` value exists, the build
  fails for that agent. Never leave an agent with no instructions.

<a id="memory"></a>
## Memory

Move a `memory` instance into `memory.ts` as the default export:

```typescript
import { Memory } from '@mastra/memory'

export default new Memory()
```

Reproduce the original configuration exactly (storage, vector store, `options` like
`lastMessages` / `semanticRecall`, processors). If the original constructed `Memory`
inline in the agent file, lift that same construction into `memory.ts`.

Precedence: `config.memory` wins over `memory.ts`, and a warning is logged when both
are present. Pick one home for memory — prefer `memory.ts` — don't set it in both.
If neither is present the agent has no memory (the default), so don't accidentally
drop an agent that previously had memory.

<a id="skills"></a>
## Skills

Skills go under `skills/`. Three layouts, all inlined into the bundle at build time:

1. **`createSkill()` in a `.ts` file** — default-export it. Best when the original
   agent already used `createSkill(...)` in code; move each into its own file:

   ```typescript
   import { createSkill } from '@mastra/core/skills'

   export default createSkill({
     name: 'forecasting',
     description: 'Use when the user asks about multi-day forecasts.',
     instructions: 'Summarize the forecast day by day and call out precipitation.',
   })
   ```

2. **Packaged `skills/<skill>/SKILL.md`** — frontmatter supplies `name` and
   `description`, the body is the instructions, and files under `references/` are
   inlined. Use when a skill has substantial instructions and reference material.

3. **Flat `skills/<skill>.md`** — the filename is the skill name and the body is the
   instructions. Use for a short, single-purpose skill.

Precedence: discovered skills merge with `config.skills`; on a name collision
`config.skills` wins (warning). If `config.skills` is a **function**, discovered
skills are ignored (warning) — in that case keep skills in `config.ts`.

<a id="workspace"></a>
## Workspace and seed files

Move a `Workspace` instance into `workspace.ts` as the default export:

```typescript
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace'

export default new Workspace({
  name: 'weather-workspace',
  filesystem: new LocalFilesystem({ basePath: './data/weather' }),
  sandbox: new LocalSandbox({ workingDirectory: './data/weather' }),
})
```

If the agent had no workspace, a discovered file-based agent gets a **default
workspace** automatically (contained filesystem + shell sandbox rooted at a
per-agent `workspace/` directory). So you usually don't need to add one.

Precedence: `config.workspace` wins over `workspace.ts`, which wins over the default.

**Seed files:** to ship starting files with the agent, add a `workspace/` directory;
every file under it is mirrored into the agent's default workspace at build time.

```text
src/mastra/agents/weather/
  config.ts
  workspace/
    README.md
    data/cities.json
```

<a id="subagents"></a>
## Subagents

If a supervisor agent delegates to child agents (they appear in its `agents` map,
or are wired as delegation tools), migrate each child into
`subagents/<childId>/` under the parent. A subagent directory has the **same layout
as a top-level agent**: `config.ts`, `instructions.md`, `tools/`, `skills/`,
`memory.ts`, `workspace.ts`, `workspace/`.

```text
src/mastra/agents/
  supervisor/
    config.ts
    instructions.md
    subagents/
      researcher/
        config.ts        # MUST set a non-empty description
        instructions.md
        tools/
          search.ts
```

The directory name is the delegation tool name the model sees (the example exposes
`researcher` to the supervisor).

Key rules:

- A subagent's `config.ts` **must set a non-empty `description`** — it's what the
  model sees when deciding whether to delegate. Missing description fails the build.

  ```typescript
  import { agentConfig } from '@mastra/core/agent'

  export default agentConfig({
    model: 'openai/gpt-5.5',
    description: 'Researches a topic and returns cited findings.',
  })
  ```

- Subagents are **isolated**: a subagent inherits nothing from its parent. Its tools,
  skills, and workspace come only from its own directory. So copy the child agent's
  own tools into the subagent directory — don't assume it reuses the parent's.
- Nesting is allowed up to **three levels** (supervisor depth 0 → depth 2). A
  `subagents/` directory deeper than that is ignored with a warning.
- A subagent id that collides with one of the parent's tool keys is a build error.
- A duplicate subagent id under the same parent is a build error.
- Subagents from `subagents/` merge with `config.agents`; on an id collision
  `config.agents` wins (warning). If `config.agents` is a **function**, discovered
  subagents are ignored (warning).

<a id="precedence"></a>
## Precedence rules reference

Full deterministic rules for coexistence:

- **Code wins on name collisions:** if an agent name exists in both code and the
  filesystem, the code-registered agent is kept and a warning is logged. → Remove
  the code registration to finish a migration.
- **A folder can hold a code agent:** if `config.ts` exports a configured
  `new Agent({ id, ... })`, that instance is used as-is and sibling
  `instructions.md`, `tools/`, `skills/`, `memory.ts`, `workspace.ts`, `subagents/`
  are ignored with warnings. Prefer `agentConfig()` so sibling files are respected.
- **Instructions:** dynamic function instructions in `config.ts` win over
  `instructions.md`; otherwise `instructions.md` wins over a static `instructions`
  string; neither present → build fails.
- **Model:** missing `model` fails the build and names the agent directory.
- **Tools:** `tools/*.ts` merge with `config.tools`; collision → `config.tools`
  wins (warning); `config.tools` as a function → discovered tools ignored (warning).
- **Skills:** `skills/` merge with `config.skills`; collision → `config.skills`
  wins (warning); `config.skills` as a function → discovered skills ignored (warning).
- **Memory:** `config.memory` wins over `memory.ts` (warning if both); neither → no
  memory.
- **Workspace:** `config.workspace` > `workspace.ts` > default workspace.
- **Subagents:** `subagents/` merge with `config.agents`; id collision →
  `config.agents` wins (warning); tool-key collision or duplicate id → build error.

<a id="mistakes"></a>
## Common migration mistakes

- **Leaving the code registration in place.** The code agent wins; the new files do
  nothing. The migration looks done but changed nothing.
- **Migrating a directly-imported agent.** If the app does `import { mastra }` and
  runs without the Mastra CLI, file-based agents aren't discovered. Keep those in code.
- **Naming the directory after the `id` instead of the map key.** The directory name
  becomes the agent's registration/lookup key. For `agents: { browserAgent }` with
  `id: 'browser-agent'`, naming the folder `browser-agent` silently changes the key
  from `browserAgent` to `browser-agent`, breaking `getAgent('browserAgent')` and
  client references. Use the map key (`browserAgent`) as the folder, and set
  `id`/`name` explicitly to keep their original values.
- **Renaming tool files.** The filename is the tool key. `getWeather.ts` for a tool
  keyed `get_weather` changes the key and breaks references.
- **Forcing a provider tool into the `createTool()` shape.** Tools like
  `openai.tools.webSearch({})` aren't `createTool()` calls. Keep them in
  `config.tools`, or default-export the object from `tools/<key>.ts` — don't rewrite
  them as `createTool()`.
- **Turning a dynamic instruction/tool/skill/agents function into files.** Functions
  can't be statically merged; discovered files are ignored. Keep functions in config.
- **Dropping memory or subagents** because they weren't obvious constructor options.
  Grep the original agent definition for every option before deleting it.
- **Setting the same thing in two places** (e.g. tool in both `config.tools` and
  `tools/`), which triggers "config wins" warnings. Pick one home per concern.
