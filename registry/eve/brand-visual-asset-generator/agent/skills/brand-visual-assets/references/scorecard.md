# Visual scorecard

Score the full pack from 1 to 10 before accepting it. Accept only scores above 8.

| Dimension | Pass condition |
| --- | --- |
| Composition | One clear focal idea; no chaotic crossings, accidental overlaps, or unbalanced empty regions |
| Brand specificity | Visual metaphor comes from the brand/product context, not generic SaaS decoration |
| Coherence | Hero, icons, and badge share stroke weight, corner radius, palette, and geometry language |
| Craft | Pixel-aligned icons, centered badge text, clean curves, purposeful grouping |
| Implementation | Valid SVG, semantic groups, themeable icons, no raster embeds, no bloated filler |

## Automatic score caps

- Cap at 6 if the hero relies on random node networks, globes, floating dashboard
  cards, or disconnected UI wireframes.
- Cap at 6 if icons use a visibly different stroke weight or visual style from
  the hero.
- Cap at 7 if any icon is muddy at 24px or unclear at 16px.
- Cap at 7 if the badge text is not optically centered.
- Cap at 7 if the SVG uses hardcoded backgrounds where transparency or theming is
  expected.
- Cap at 8 if the pack is clean but generic.

## Regeneration note

When a score is capped, name the cap reason in the next
`generate_svg_with_arrow` brief and ask for a specific replacement metaphor, not
vague polish.
