# Per-asset brief template

Include every field in each `generate_svg_with_arrow` brief:

| Field | Value |
| --- | --- |
| `assetType` | `icon` \| `empty-state` \| `hero` \| `badge` \| `feature-graphic` \| `onboarding` \| `changelog` \| `dashboard-modal` |
| `filename` | kebab-case ending in `.svg` |
| `purpose` | one sentence on where it ships |
| `dimensions` | viewBox or aspect ratio (for example `1200x630` hero, `24x24` icon) |
| `palette` | named colors with hex from the locked brand profile |
| `subject` | what to depict |
| `text` | exact copy if the SVG includes text |
| `styleNotes` | stroke weight, corner radius, illustration density, metaphors to use or avoid |
| `tasteNotes` | what should make the asset feel sharp, premium, and brand-specific |
| `referenceImages` | optional public image URLs or base64 references from Context.dev logos/backdrops/screenshots when they materially improve style, palette, typography, or composition |
| `preserveFromReference` | when references are used, the exact style, color relationships, layout, typography direction, or structure to preserve |
| `changeFromReference` | when references are used, the subject, dimensions, or asset-specific details that should change |
| `constraints` | for example `currentColor`, no gradients, dark-mode safe |

Every brief must include at least one negative constraint, such as "avoid generic
globe/network art", "avoid repeated decorative dot grids", or "avoid stock SaaS
dashboard cards". Negative constraints prevent the SVG tool from falling back
to obvious visual clichés.

Keep the brief compact and structured. Prefer one concrete vector concept over a
long prose dump of brand facts. Use reference images for brand style or
composition when Context.dev returns suitable logos, backdrops, or source images.
