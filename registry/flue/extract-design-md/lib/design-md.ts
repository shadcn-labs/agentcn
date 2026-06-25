/** DESIGN.md prompt spec and helpers. */

export const DESIGN_MD_SPEC_SUMMARY = `DESIGN.md is a self-contained plain-text representation of a design system. It contains optional YAML frontmatter with normative machine-readable tokens and a Markdown body with human-readable rationale.

YAML frontmatter:
- Must begin and end with a line containing exactly ---
- Common top-level keys: version, name, description, colors, typography, rounded, spacing, components
- Color values must be SRGB hex strings beginning with #
- Typography tokens may include fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontFeature, and fontVariation
- Dimension units may be px, em, or rem; unitless lineHeight is allowed
- Token references use {path.to.token}; component tokens may reference composite values

Markdown body sections should appear in this order when relevant:
1. Overview
2. Colors
3. Typography
4. Layout
5. Elevation & Depth
6. Shapes
7. Components
8. Do's and Don'ts

Recommended token names include colors primary, secondary, tertiary, neutral, surface, on-surface, error; typography headline-display, headline-lg, headline-md, body-lg, body-md, body-sm, label-lg, label-md, label-sm; rounded none, sm, md, lg, xl, full.`

export const DESIGN_MD_SYSTEM =
  'You are a senior design systems writer. Produce concise, implementation-grade DESIGN.md files that follow the requested spec.'

export function buildDesignMdPrompt(input: {
  domain: string
  contextStyleguide: unknown
  screenshotUrl?: string
  markdown?: string
}): string {
  const markdownExcerpt = input.markdown
    ? input.markdown.slice(0, 3000)
    : 'No Markdown returned.'

  return `Generate a polished DESIGN.md document for ${input.domain}.

Follow this Google DESIGN.md specification summary:
${DESIGN_MD_SPEC_SUMMARY}

Use the Context.dev extracted styleguide as the primary source of design tokens. Use the screenshot URL and Markdown page content as supporting evidence for tone, component usage, and layout guidance.

Requirements:
- Return only DESIGN.md content, no commentary before or after it.
- Include YAML frontmatter with version: alpha, name, description, colors, typography, rounded, spacing, and components.
- Include the Markdown sections in the specified order.
- Prefer precise values present in the Context.dev payload.
- If data is missing, infer conservatively and state uncertainty in prose, not in token values.
- Make Do's and Don'ts concrete enough for another AI agent to use.

Context.dev styleguide JSON:
${JSON.stringify(input.contextStyleguide, null, 2).slice(0, 18000)}

Screenshot URL:
${input.screenshotUrl ?? 'No screenshot returned.'}

Homepage Markdown excerpt:
${markdownExcerpt}`
}
