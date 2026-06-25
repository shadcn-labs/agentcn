---
name: design-md
description: Specification for composing a self-contained DESIGN.md design-system document from extracted design tokens, brand assets, a screenshot, and page Markdown.
---

## Goal

Turn the four context.dev payloads (styleguide, brand, screenshot, markdown)
into a single self-contained `DESIGN.md` that another agent or designer could
use to rebuild the site's look and feel — following the `DESIGN.md` convention.

## Document shape

Start with YAML frontmatter, then the canonical sections in order.

```markdown
---
version: 1
name: <brand or site name>
description: <one-line summary of the visual identity>
colors:
  # token name -> SRGB hex, e.g. brand.primary: "#1A73E8"
typography:
  # role -> family / size / weight
rounded:
  # named radii
spacing:
  # named spacing steps
components:
  # named component tokens, referencing others as {path.to.token}
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
```

## Rules

- Use **precise values** from the styleguide payload. Colors as SRGB hex
  (`#RRGGBB`). Reference other tokens with `{path.to.token}` syntax.
- Pull name, slogan, logos, and industry from the brand payload; use the
  screenshot URL and page Markdown only to ground descriptions in the Overview.
- Where a value is genuinely absent, infer conservatively and mark it as
  inferred rather than fabricating exact numbers.
- "Do's and Don'ts" should be short, concrete usage rules derived from the
  observed system (e.g. spacing scale, color contrast, component usage).
- Output only the `DESIGN.md` document — no commentary around it.
