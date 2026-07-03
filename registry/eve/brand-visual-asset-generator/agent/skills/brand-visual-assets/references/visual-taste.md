# Visual taste bar

Reject and regenerate any asset that feels generic, cluttered, or decorative
without purpose.

## Prefer

- One memorable focal idea per asset
- Asymmetric composition with deliberate negative space
- Brand-specific geometry, product metaphors, or motion cues from the source
  website
- A restrained palette: primary, one accent, neutral, and background
- Simple reusable structures: `<symbol>`, `<pattern>`, or grouped motifs instead
  of dozens of copied primitives
- Icons that read at 16px and feel crisp at 24px
- Integrated compositions where interface, data, and product metaphors interact
  as one scene

## Avoid

- Generic fintech globes, random network nodes, stock dashboard cards, and
  floating rectangles unless the brief explicitly asks for them
- Split scenes where a literal UI wireframe sits beside unrelated abstract lines
  or floating nodes
- Decorative dot grids that do not support the composition
- Centered "everything connected to everything" layouts
- Gradients, shadows, or glows used to compensate for weak composition
- Text inside tiny icons
- Overly literal currency symbols unless the asset specifically needs payment or
  currency meaning

## Regeneration prompt pattern

When an asset fails this bar, regenerate only that asset with a tighter note:

> The previous asset is too generic. Keep the same palette and dimensions, but
> replace the visual metaphor with [specific direction]. Use fewer shapes, stronger
> negative space, semantic groups, and no decorative filler.
