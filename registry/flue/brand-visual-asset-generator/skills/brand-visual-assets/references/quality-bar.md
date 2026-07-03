# Quality bar

Reject tool output and regenerate the individual asset when any of these fail:

- Not valid SVG markup
- Raster embed without an approved logo URL from brand data
- Color outside the locked brand profile palette
- Invented logo, trademark, or product claim
- Missing `viewBox` on a sized graphic
- Missing `<title>` or `<desc>` when the graphic conveys meaning
- Missing semantic `<g id="...">` groups on hero, empty-state, onboarding, or
  feature-graphic assets
- Hardcoded brand colors in icons that should use `currentColor`
- Repeated primitive filler that could be a pattern, symbol, or omitted entirely
- A generic SaaS cliché when the brief asked for brand-specific visual direction
- Sloppy overlaps, clipped shapes, abrupt path endpoints, or messy crossings
- Badge text that is not optically centered
- Icons that are muddy at 24px or fail when mentally scaled to 16px

Also check `references/consistency.md` before accepting the full pack.
