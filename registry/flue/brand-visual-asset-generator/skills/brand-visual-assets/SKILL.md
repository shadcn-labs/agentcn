---
name: brand-visual-assets
description: Scope and ship a brand-aligned pack of SVG assets for SaaS products. Use when the user wants a visual pack, feature launch assets, icons, empty states, hero illustrations, badges, feature graphics, onboarding visuals, changelog art, or dashboard/modal graphics.
---

# Pack workflow

Run these steps in order. A **pack** is one coherent set of SVG assets that share
palette, stroke language, and illustration metaphors.

## 1. Scope the pack

List every asset the run will produce: type, filename, purpose, and channel
(marketing page, in-app empty state, onboarding, and so on).

**Done when:** every requested asset has a named slot; no orphan types remain.

If the user gave no item list, load `references/default-pack.md` and adopt that
pack unless they named specific types or channels.

## 2. Lock the brand profile

Capture the palette and tone the pack will obey from Context.dev output or the
user's explicit brand profile.

**Done when:** primary and secondary hex colors, neutral/background tones,
typography personality, logo constraints, product category, audience, and tone
adjectives are all recorded before any brief is written.

Also collect up to four useful reference images when available, such as
Context.dev logo URLs, brand backdrops, or product screenshots. Use them only
when they improve style, color, layout, or typography fidelity.

## 3. Write a brief per asset

For each pack slot, compose one self-contained **brief** for
`generate_svg_with_arrow`.

**Done when:** every slot has a brief containing every field in
`references/brief-template.md`.

## 4. Generate

Call `generate_svg_with_arrow` once per brief. Pass the full brief, asset type,
filename, dimensions, and any reference images selected for that asset.

**Done when:** every brief has a matching tool result with `ok: true` and SVG
markup. If the tool reports missing AI Gateway credentials or an upstream model
error, stop and report the configuration failure instead of inventing SVGs.

## 5. Score the pack

Run the pack through the scorecard before accepting it.

**Done when:** every asset passes `references/quality-bar.md`,
`references/consistency.md`, `references/visual-taste.md`, and scores above 8 on
`references/scorecard.md`; any asset that is ugly, generic, off-palette,
visually incoherent, or scores 8 or below is regenerated individually with a
tighter brief, not the whole pack unless the brand profile changed.

## 6. Deliver the SVGs

Return the actual final SVG markup for every accepted asset. Put each asset under
a Markdown heading that includes the filename, followed by exactly one fenced
`svg` block containing only that asset's SVG markup.

**Done when:** the final answer contains one fenced `svg` block per accepted
asset. A summary that says the pack is complete but omits the SVG blocks is a
failed delivery and must be corrected before finishing.
