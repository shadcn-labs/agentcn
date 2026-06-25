/** Verbatim port from designmd-supply. */

export type LiveColor = { hex: string; name: string | null }
export type LiveBrand = { colors?: LiveColor[] }
type LiveStyleguideButton = {
  backgroundColor?: string
  borderColor?: string
  borderRadius?: string
  borderStyle?: string
  borderWidth?: string
  boxShadow?: string
  color?: string
  css?: string
  fontFallbacks?: string[]
  fontFamily?: string
  fontSize?: string
  fontWeight?: number
  padding?: string
}
type LiveStyleguideCard = {
  backgroundColor?: string
  borderColor?: string
  borderRadius?: string
  borderStyle?: string
  borderWidth?: string
  boxShadow?: string
  css?: string
  padding?: string
  textColor?: string
}
type LiveStyleguideText = {
  fontFallbacks?: string[]
  fontFamily?: string
  fontSize?: string
  fontWeight?: number
  letterSpacing?: string
  lineHeight?: string
}
type LiveStyleguideShadows = {
  inner?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
}
type LiveStyleguideSpacing = {
  xs?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
}
type LiveStyleguideFontLink = {
  type?: 'google' | 'custom'
  category?: string
  displayName?: string
  files?: Record<string, string>
}
export type LiveStyleguide = {
  mode?: 'light' | 'dark'
  colors?: { accent?: string; background?: string; text?: string }
  components?: {
    button?: {
      primary?: LiveStyleguideButton
      secondary?: LiveStyleguideButton
      link?: LiveStyleguideButton
    }
    card?: LiveStyleguideCard
  }
  typography?: {
    headings?: {
      h1?: LiveStyleguideText
      h2?: LiveStyleguideText
      h3?: LiveStyleguideText
      h4?: LiveStyleguideText
    }
    p?: LiveStyleguideText
  }
  elementSpacing?: LiveStyleguideSpacing
  shadows?: LiveStyleguideShadows
  fontLinks?: Record<string, LiveStyleguideFontLink>
  raw?: unknown
}

/* ------------------------------------------------------------ */
/* Color utilities                                              */
/* ------------------------------------------------------------ */

type RGB = { r: number; g: number; b: number };

function parseHex(hex: string | null | undefined): RGB | null {
  if (!hex) return null;
  const clean = hex.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(clean)) {
    return null;
  }
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6 || clean.length === 8) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

function toHex(c: RGB): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

function luminance({ r, g, b }: RGB): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const isDark = (c: RGB) => luminance(c) < 0.5;
const readable = (bg: RGB): string => (isDark(bg) ? "#ffffff" : "#0a0a0a");

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function formatNumber(n: number, decimals = 4): string {
  const fixed = n.toFixed(decimals);
  return fixed.replace(/\.?0+$/, "");
}

function rgbToHslToken({ r, g, b }: RGB): string {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rr) h = ((gg - bb) / delta) % 6;
    else if (max === gg) h = (bb - rr) / delta + 2;
    else h = (rr - gg) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `hsl(${formatNumber(h, 1)} ${formatNumber(s * 100, 1)}% ${formatNumber(
    l * 100,
    1,
  )}%)`;
}

function normalizeCssColor(
  raw: string | null | undefined,
): { color: string; opacity?: number } | null {
  if (!raw) return null;
  const value = raw.trim();
  const hex = parseHex(value);
  if (hex) return { color: rgbToHslToken(hex) };

  const hsl = value.match(/^hsla?\((.+)\)$/i);
  if (hsl) {
    const body = hsl[1].trim();
    const [channels, alphaPart] = body.includes("/")
      ? body.split("/")
      : [body, undefined];
    const parts = channels
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]);
      const l = parseFloat(parts[2]);
      const alpha =
        alphaPart !== undefined
          ? parseFloat(alphaPart)
          : parts[3] !== undefined
            ? parseFloat(parts[3])
            : undefined;
      if ([h, s, l].every(Number.isFinite)) {
        return {
          color: `hsl(${formatNumber(h, 1)} ${formatNumber(s, 1)}% ${formatNumber(
            l,
            1,
          )}%)`,
          opacity:
            typeof alpha === "number" && Number.isFinite(alpha)
              ? clamp(alpha, 0, 1)
              : undefined,
        };
      }
    }
  }

  const rgb = value.match(/^rgba?\((.+)\)$/i);
  if (rgb) {
    const body = rgb[1].trim();
    const [channels, alphaPart] = body.includes("/")
      ? body.split("/")
      : [body, undefined];
    const parts = channels
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      const toChannel = (part: string) => {
        const n = parseFloat(part);
        return part.endsWith("%") ? (n / 100) * 255 : n;
      };
      const color = {
        r: toChannel(parts[0]),
        g: toChannel(parts[1]),
        b: toChannel(parts[2]),
      };
      const alpha =
        alphaPart !== undefined
          ? parseFloat(alphaPart)
          : parts[3] !== undefined
            ? parseFloat(parts[3])
            : undefined;
      if ([color.r, color.g, color.b].every(Number.isFinite)) {
        return {
          color: rgbToHslToken(color),
          opacity:
            typeof alpha === "number" && Number.isFinite(alpha)
              ? clamp(alpha, 0, 1)
              : undefined,
        };
      }
    }
  }

  return null;
}

/* ------------------------------------------------------------ */
/* Length utilities                                             */
/* ------------------------------------------------------------ */

function toPx(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(-?\d*\.?\d+)\s*(px|rem|em)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] ?? "px").toLowerCase();
  if (unit === "rem" || unit === "em") return n * 16;
  return n;
}

function toPxList(value: string | null | undefined): number[] {
  if (!value) return [];
  return value
    .trim()
    .split(/\s+/)
    .map((part) => toPx(part))
    .filter((part): part is number => part !== null && part > 0);
}

function pxToRem(px: number): string {
  const rem = px / 16;
  const fixed = rem.toFixed(4);
  return `${fixed.replace(/\.?0+$/, "")}rem`;
}

/* ------------------------------------------------------------ */
/* Font utilities                                               */
/* ------------------------------------------------------------ */

const SANS_FALLBACKS = ["ui-sans-serif", "system-ui", "sans-serif"];
const SERIF_FALLBACKS = ["ui-serif", "Georgia", "serif"];
const MONO_FALLBACKS = ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"];

function quoteIfNeeded(name: string): string {
  const trimmed = name.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return trimmed;
  if (/[^a-zA-Z0-9_-]/.test(trimmed) && !/^[a-z-]+$/.test(trimmed)) {
    return `"${trimmed}"`;
  }
  return trimmed;
}

function buildFontStack(
  primary: string | undefined,
  fallbacks: string[] | undefined,
  generic: string[],
): string {
  const seen = new Set<string>();
  const stack: string[] = [];
  const push = (name: string | undefined) => {
    if (!name) return;
    const trimmed = name.trim().replace(/^["']|["']$/g, "");
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    stack.push(quoteIfNeeded(trimmed));
  };
  push(primary);
  (fallbacks ?? []).forEach(push);
  generic.forEach(push);
  return stack.join(", ");
}

function classifyFamily(
  family: string | undefined,
  fontLinks: Record<string, LiveStyleguideFontLink> | undefined,
): "sans" | "serif" | "mono" | "unknown" {
  if (!family) return "unknown";
  const first = family.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
  if (first && fontLinks?.[first]?.category) {
    const cat = fontLinks[first].category!.toLowerCase();
    if (cat.includes("mono")) return "mono";
    if (cat.includes("serif") && !cat.includes("sans")) return "serif";
    if (cat.includes("sans") || cat.includes("display") || cat.includes("hand"))
      return "sans";
  }
  const stripped = family.toLowerCase().replace(/sans-serif/g, "");
  if (/\b(monospace|mono)\b/.test(family.toLowerCase())) return "mono";
  if (/\bserif\b/.test(stripped)) return "serif";
  if (/\bsans-serif\b/.test(family.toLowerCase())) return "sans";
  return "unknown";
}

function findMonoFamily(
  fontLinks: Record<string, LiveStyleguideFontLink> | undefined,
): string | undefined {
  if (!fontLinks) return undefined;
  for (const [name, link] of Object.entries(fontLinks)) {
    if (link.category?.toLowerCase().includes("mono")) return name;
  }
  return undefined;
}

function findSerifFamily(
  fontLinks: Record<string, LiveStyleguideFontLink> | undefined,
  exclude: Set<string>,
): string | undefined {
  if (!fontLinks) return undefined;
  for (const [name, link] of Object.entries(fontLinks)) {
    if (exclude.has(name.toLowerCase())) continue;
    const cat = link.category?.toLowerCase() ?? "";
    if (cat.includes("serif") && !cat.includes("sans")) return name;
  }
  return undefined;
}

type FontTokens = { sans: string; serif: string; mono: string };

function pickFonts(styleguide: LiveStyleguide | null | undefined): FontTokens {
  const body = styleguide?.typography?.p;
  const h1 = styleguide?.typography?.headings?.h1;
  const links = styleguide?.fontLinks;

  const sansFamily = body?.fontFamily ?? h1?.fontFamily;
  const sansFallbacks = body?.fontFallbacks ?? h1?.fontFallbacks;
  const sans = buildFontStack(sansFamily, sansFallbacks, SANS_FALLBACKS);

  const used = new Set<string>();
  if (sansFamily) used.add(sansFamily.toLowerCase());

  let serif: string | undefined;
  const headingCandidates: Array<LiveStyleguideText | undefined> = [
    h1,
    styleguide?.typography?.headings?.h2,
    styleguide?.typography?.headings?.h3,
  ];
  for (const head of headingCandidates) {
    const fam = head?.fontFamily;
    if (!fam || used.has(fam.toLowerCase())) continue;
    if (classifyFamily(fam, links) === "serif") {
      serif = buildFontStack(fam, head?.fontFallbacks, SERIF_FALLBACKS);
      break;
    }
  }
  if (!serif) {
    const fromLinks = findSerifFamily(links, used);
    if (fromLinks) serif = buildFontStack(fromLinks, undefined, SERIF_FALLBACKS);
  }

  const monoFamily = findMonoFamily(links);
  const mono = buildFontStack(monoFamily, undefined, MONO_FALLBACKS);

  return {
    sans,
    serif: serif ?? buildFontStack(undefined, undefined, SERIF_FALLBACKS),
    mono,
  };
}

/* ------------------------------------------------------------ */
/* Radius / shadows / spacing                                   */
/* ------------------------------------------------------------ */

const MIN_SPACING_PX = 3.5;
const DEFAULT_SPACING_PX = 4;
const MAX_SPACING_PX = 5;

function pickRadius(styleguide: LiveStyleguide | null | undefined): string {
  const cardRadius = toPx(styleguide?.components?.card?.borderRadius);
  const buttonRadius = toPx(styleguide?.components?.button?.primary?.borderRadius);
  const px = cardRadius ?? buttonRadius;
  if (px === null) return "0.5rem";
  const clamped = Math.min(Math.max(px, 2), 16);
  return pxToRem(clamped);
}

type ShadowTokens = {
  x: string;
  y: string;
  blur: string;
  spread: string;
  opacity: string;
  color: string;
  shadow2xs: string;
  xs: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  shadow2xl: string;
};

type ParsedShadow = {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color?: string;
  opacity?: number;
};

function normalizePxToken(value: string | undefined, fallback: string): string {
  const px = toPx(value);
  if (px === null) return fallback;
  return `${formatNumber(px, 2)}px`;
}

function splitShadowLayers(value: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      layers.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  layers.push(value.slice(start).trim());
  return layers.filter(Boolean);
}

function findColorSnippet(layer: string): string | null {
  const functional = layer.match(/\b(?:rgba?|hsla?)\([^)]+\)/i);
  if (functional) return functional[0];
  const hex = layer.match(/#[0-9a-f]{3,8}\b/i);
  return hex?.[0] ?? null;
}

function parseBoxShadow(value: string | null | undefined): ParsedShadow | null {
  if (!value || value.trim().toLowerCase() === "none") return null;
  const layer = splitShadowLayers(value)[0];
  if (!layer) return null;

  const colorSnippet = findColorSnippet(layer);
  const color = normalizeCssColor(colorSnippet);
  const withoutColor = colorSnippet ? layer.replace(colorSnippet, " ") : layer;
  const lengths = withoutColor
    .replace(/\binset\b/gi, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => toPx(part) !== null);

  if (lengths.length < 2) return null;

  return {
    x: normalizePxToken(lengths[0], "0px"),
    y: normalizePxToken(lengths[1], "2px"),
    blur: normalizePxToken(lengths[2], "3px"),
    spread: normalizePxToken(lengths[3], "0px"),
    color: color?.color,
    opacity: color?.opacity,
  };
}

function colorWithOpacity(color: string, opacity: number): string {
  const alpha = formatNumber(clamp(opacity, 0, 1), 4);
  const hsl = color.match(/^hsl\((.+)\)$/i);
  if (hsl) return `hsl(${hsl[1]} / ${alpha})`;
  const rgb = color.match(/^rgb\((.+)\)$/i);
  if (rgb) return `rgb(${rgb[1]} / ${alpha})`;
  return color;
}

function fallbackShadowColor(palette: Palette, mode: "light" | "dark"): string {
  const bg = parseHex(palette.background);
  const fg = parseHex(palette.foreground);
  if (mode === "dark") return "hsl(0 0% 5%)";
  if (bg && fg) return rgbToHslToken(mix(fg, bg, 0.15));
  return fg ? rgbToHslToken(fg) : "hsl(0 0% 5%)";
}

function buildShadowTokens(base: {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  opacity: number;
}): ShadowTokens {
  const half = base.opacity * 0.5;
  const heavy = Math.min(base.opacity * 2.5, 0.75);
  const main = colorWithOpacity(base.color, base.opacity);
  const quiet = colorWithOpacity(base.color, half);
  const loud = colorWithOpacity(base.color, heavy);
  const first = `${base.x} ${base.y} ${base.blur} ${base.spread}`;
  const second = (y: string, blur: string, spread: string) =>
    `${base.x} ${y} ${blur} ${spread}`;

  return {
    x: base.x,
    y: base.y,
    blur: base.blur,
    spread: base.spread,
    opacity: formatNumber(base.opacity, 4),
    color: base.color,
    shadow2xs: `${first} ${quiet}`,
    xs: `${first} ${quiet}`,
    sm: `${first} ${main}, ${second("1px", "2px", "-1px")} ${main}`,
    base: `${first} ${main}, ${second("1px", "2px", "-1px")} ${main}`,
    md: `${first} ${main}, ${second("2px", "4px", "-1px")} ${main}`,
    lg: `${first} ${main}, ${second("4px", "6px", "-1px")} ${main}`,
    xl: `${first} ${main}, ${second("8px", "10px", "-1px")} ${main}`,
    shadow2xl: `${first} ${loud}`,
  };
}

function pickShadows(
  styleguide: LiveStyleguide | null | undefined,
  palette: Palette,
  mode: "light" | "dark",
): ShadowTokens {
  const s = styleguide?.shadows;
  const candidates = [
    s?.md,
    styleguide?.components?.card?.boxShadow,
    styleguide?.components?.button?.primary?.boxShadow,
    s?.sm,
    s?.lg,
    s?.xl,
  ];
  const parsed = candidates.map(parseBoxShadow).find(Boolean);

  return buildShadowTokens({
    x: parsed?.x ?? "0px",
    y: parsed?.y ?? "2px",
    blur: parsed?.blur ?? "3px",
    spread: parsed?.spread ?? "0px",
    color: parsed?.color ?? fallbackShadowColor(palette, mode),
    opacity: parsed?.opacity ?? 0.18,
  });
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function pickSpacing(styleguide: LiveStyleguide | null | undefined): string {
  const sp = styleguide?.elementSpacing;
  const scaleCandidates = [
    toPx(sp?.xs),
    toPx(sp?.sm) ? toPx(sp?.sm)! / 2 : null,
    toPx(sp?.md) ? toPx(sp?.md)! / 4 : null,
    toPx(sp?.lg) ? toPx(sp?.lg)! / 6 : null,
    toPx(sp?.xl) ? toPx(sp?.xl)! / 8 : null,
  ].filter((value): value is number => value !== null && value > 0);

  const componentPadding = [
    styleguide?.components?.button?.primary?.padding,
    styleguide?.components?.button?.secondary?.padding,
    styleguide?.components?.card?.padding,
  ].flatMap((value) => toPxList(value));
  const paddingCandidates = componentPadding.map((value) => value / 4);

  const picked = median([...scaleCandidates, ...paddingCandidates]) ?? DEFAULT_SPACING_PX;
  const safeUnit = clamp(
    Math.round(picked * 2) / 2,
    MIN_SPACING_PX,
    MAX_SPACING_PX,
  );
  return pxToRem(safeUnit);
}

function pickTrackingNormal(
  styleguide: LiveStyleguide | null | undefined,
): string {
  const values = [
    styleguide?.typography?.p?.letterSpacing,
    styleguide?.typography?.headings?.h1?.letterSpacing,
  ];
  const value = values.find((v) => v && v.trim().toLowerCase() !== "normal");
  if (!value) return "0em";
  const trimmed = value.trim();
  const m = trimmed.match(/^(-?\d*\.?\d+)\s*(px|rem|em)?$/i);
  if (!m) return trimmed;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return "0em";
  const unit = (m[2] ?? "em").toLowerCase();
  if (unit === "px") return `${formatNumber(n / 16, 4)}em`;
  return `${formatNumber(n, 4)}em`;
}

/* ------------------------------------------------------------ */
/* Palette                                                      */
/* ------------------------------------------------------------ */

type Palette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart: [string, string, string, string, string];
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};

function buildPalette(
  brand: LiveBrand | undefined,
  styleguide: LiveStyleguide | null | undefined,
  mode: "light" | "dark",
): Palette {
  const sgMode = styleguide?.mode;
  const sourceIsLight = sgMode !== "dark";
  const direct = mode === (sourceIsLight ? "light" : "dark");

  const brandColors = (brand?.colors ?? [])
    .map((c) => parseHex(c.hex))
    .filter((c): c is RGB => c !== null);
  const namedBrandAccent = parseHex(
    (brand?.colors ?? []).find((color) =>
      /accent|secondary|highlight|support/i.test(color.name ?? ""),
    )?.hex,
  );

  const sgBg = parseHex(styleguide?.colors?.background);
  const sgFg = parseHex(styleguide?.colors?.text);
  const sgAccent = parseHex(styleguide?.colors?.accent);

  const btnPrimary = styleguide?.components?.button?.primary;
  const btnSecondary = styleguide?.components?.button?.secondary;
  const btnLink = styleguide?.components?.button?.link;
  const card = styleguide?.components?.card;

  const sgPrimaryBg = parseHex(btnPrimary?.backgroundColor);
  const sgPrimaryFg = parseHex(btnPrimary?.color);
  const sgSecondaryBg = parseHex(btnSecondary?.backgroundColor);
  const sgSecondaryFg = parseHex(btnSecondary?.color);
  const sgLinkAccent = parseHex(btnLink?.backgroundColor ?? btnLink?.color);
  const sgCardBg = parseHex(card?.backgroundColor);
  const sgCardFg = parseHex(card?.textColor);
  const sgCardBorder = parseHex(card?.borderColor);
  const sgBtnBorder = parseHex(btnSecondary?.borderColor ?? btnPrimary?.borderColor);
  const sourceAccent =
    sgAccent ?? sgLinkAccent ?? namedBrandAccent ?? brandColors[1] ?? null;

  let background: RGB;
  let foreground: RGB;
  let primary: RGB;
  let primaryForeground: RGB | null;
  let secondary: RGB;
  let secondaryForeground: RGB | null;
  let accent: RGB;
  let cardBg: RGB;
  let cardFg: RGB | null;
  let border: RGB | null;

  if (direct) {
    background = sgBg ?? (mode === "light" ? WHITE : { r: 23, g: 23, b: 21 });
    foreground =
      sgFg ?? (mode === "light" ? { r: 10, g: 10, b: 10 } : { r: 245, g: 245, b: 244 });
    primary = sgPrimaryBg ?? brandColors[0] ?? sourceAccent ?? foreground;
    primaryForeground = sgPrimaryBg ? sgPrimaryFg : null;
    accent = sourceAccent ?? primary;
    secondary =
      sgSecondaryBg ??
      (sourceAccent ? mix(background, sourceAccent, 0.16) : undefined) ??
      mix(background, primary, 0.18);
    secondaryForeground = sgSecondaryBg ? sgSecondaryFg : null;
    cardBg = sgCardBg ?? mix(background, foreground, 0.03);
    cardFg = sgCardFg;
    border = sgCardBorder ?? sgBtnBorder;
  } else {
    if (mode === "light") {
      background = WHITE;
      foreground = { r: 10, g: 10, b: 10 };
    } else {
      background = { r: 23, g: 23, b: 21 };
      foreground = { r: 245, g: 245, b: 244 };
    }
    const basePrimary = sgPrimaryBg ?? brandColors[0] ?? sourceAccent ?? foreground;
    if (mode === "dark" && isDark(basePrimary)) {
      primary = mix(basePrimary, WHITE, 0.3);
    } else if (mode === "light" && !isDark(basePrimary)) {
      primary = mix(basePrimary, BLACK, 0.15);
    } else {
      primary = basePrimary;
    }
    primaryForeground = sgPrimaryBg ? sgPrimaryFg : null;
    const baseAccent = sourceAccent ?? primary;
    if (mode === "dark" && isDark(baseAccent)) {
      accent = mix(baseAccent, WHITE, 0.25);
    } else if (mode === "light" && !isDark(baseAccent)) {
      accent = mix(baseAccent, BLACK, 0.12);
    } else {
      accent = baseAccent;
    }
    const baseSecondary =
      sgSecondaryBg ??
      mix(background, accent, mode === "light" ? 0.16 : 0.24) ??
      mix(background, primary, 0.18);
    secondary = baseSecondary;
    secondaryForeground = sgSecondaryBg ? sgSecondaryFg : null;
    cardBg = mix(background, foreground, mode === "light" ? 0.03 : 0.07);
    cardFg = null;
    border = null;
  }

  const muted = mix(background, foreground, mode === "light" ? 0.05 : 0.1);
  const mutedFg = mix(foreground, background, 0.4);
  const finalBorder = border ?? mix(background, foreground, mode === "light" ? 0.12 : 0.2);
  const sidebar = mix(background, foreground, mode === "light" ? 0.04 : 0.05);

  const chartCandidates = [accent, primary, secondary, ...brandColors];
  const seenChartColors = new Set<string>();
  const uniqueChartColors = chartCandidates.filter((color) => {
    const hex = toHex(color);
    if (seenChartColors.has(hex)) return false;
    seenChartColors.add(hex);
    return true;
  });
  const chart: [RGB, RGB, RGB, RGB, RGB] = [
    uniqueChartColors[0] ?? primary,
    uniqueChartColors[1] ?? mix(primary, WHITE, 0.3),
    uniqueChartColors[2] ?? mix(primary, BLACK, 0.25),
    uniqueChartColors[3] ?? mix(primary, WHITE, 0.55),
    uniqueChartColors[4] ?? mix(primary, BLACK, 0.45),
  ];

  return {
    background: toHex(background),
    foreground: toHex(foreground),
    card: toHex(cardBg),
    cardForeground: toHex(cardFg ?? foreground),
    popover: toHex(cardBg),
    popoverForeground: toHex(cardFg ?? foreground),
    primary: toHex(primary),
    primaryForeground: primaryForeground ? toHex(primaryForeground) : readable(primary),
    secondary: toHex(secondary),
    secondaryForeground: secondaryForeground
      ? toHex(secondaryForeground)
      : readable(secondary),
    muted: toHex(muted),
    mutedForeground: toHex(mutedFg),
    accent: toHex(accent),
    accentForeground: readable(accent),
    destructive: mode === "light" ? "#dc2626" : "#ef4444",
    destructiveForeground: "#ffffff",
    border: toHex(finalBorder),
    input: toHex(finalBorder),
    ring: toHex(accent),
    chart: chart.map(toHex) as [string, string, string, string, string],
    sidebar: toHex(sidebar),
    sidebarForeground: toHex(foreground),
    sidebarPrimary: toHex(primary),
    sidebarPrimaryForeground: primaryForeground
      ? toHex(primaryForeground)
      : readable(primary),
    sidebarAccent: toHex(accent),
    sidebarAccentForeground: readable(accent),
    sidebarBorder: toHex(finalBorder),
    sidebarRing: toHex(accent),
  };
}

/* ------------------------------------------------------------ */
/* Output formatting                                            */
/* ------------------------------------------------------------ */

function paletteLines(p: Palette): string[] {
  return [
    `--background: ${p.background};`,
    `--foreground: ${p.foreground};`,
    `--card: ${p.card};`,
    `--card-foreground: ${p.cardForeground};`,
    `--popover: ${p.popover};`,
    `--popover-foreground: ${p.popoverForeground};`,
    `--primary: ${p.primary};`,
    `--primary-foreground: ${p.primaryForeground};`,
    `--secondary: ${p.secondary};`,
    `--secondary-foreground: ${p.secondaryForeground};`,
    `--muted: ${p.muted};`,
    `--muted-foreground: ${p.mutedForeground};`,
    `--accent: ${p.accent};`,
    `--accent-foreground: ${p.accentForeground};`,
    `--destructive: ${p.destructive};`,
    `--destructive-foreground: ${p.destructiveForeground};`,
    `--border: ${p.border};`,
    `--input: ${p.input};`,
    `--ring: ${p.ring};`,
    `--chart-1: ${p.chart[0]};`,
    `--chart-2: ${p.chart[1]};`,
    `--chart-3: ${p.chart[2]};`,
    `--chart-4: ${p.chart[3]};`,
    `--chart-5: ${p.chart[4]};`,
    `--sidebar: ${p.sidebar};`,
    `--sidebar-foreground: ${p.sidebarForeground};`,
    `--sidebar-primary: ${p.sidebarPrimary};`,
    `--sidebar-primary-foreground: ${p.sidebarPrimaryForeground};`,
    `--sidebar-accent: ${p.sidebarAccent};`,
    `--sidebar-accent-foreground: ${p.sidebarAccentForeground};`,
    `--sidebar-border: ${p.sidebarBorder};`,
    `--sidebar-ring: ${p.sidebarRing};`,
  ];
}

function nonColorLines(
  fonts: FontTokens,
  radius: string,
  shadows: ShadowTokens,
  trackingNormal?: string,
  spacing?: string,
): string[] {
  const lines: string[] = [];
  lines.push(`--font-sans: ${fonts.sans};`);
  lines.push(`--font-serif: ${fonts.serif};`);
  lines.push(`--font-mono: ${fonts.mono};`);
  lines.push(`--radius: ${radius};`);
  lines.push(`--shadow-x: ${shadows.x};`);
  lines.push(`--shadow-y: ${shadows.y};`);
  lines.push(`--shadow-blur: ${shadows.blur};`);
  lines.push(`--shadow-spread: ${shadows.spread};`);
  lines.push(`--shadow-opacity: ${shadows.opacity};`);
  lines.push(`--shadow-color: ${shadows.color};`);
  lines.push(`--shadow-2xs: ${shadows.shadow2xs};`);
  lines.push(`--shadow-xs: ${shadows.xs};`);
  lines.push(`--shadow-sm: ${shadows.sm};`);
  lines.push(`--shadow: ${shadows.base};`);
  lines.push(`--shadow-md: ${shadows.md};`);
  lines.push(`--shadow-lg: ${shadows.lg};`);
  lines.push(`--shadow-xl: ${shadows.xl};`);
  lines.push(`--shadow-2xl: ${shadows.shadow2xl};`);
  if (trackingNormal) lines.push(`--tracking-normal: ${trackingNormal};`);
  if (spacing) lines.push(`--spacing: ${spacing};`);

  return lines;
}

function indent(lines: string[]): string {
  return lines.map((l) => `  ${l}`).join("\n");
}

function themeInlineBlock(): string {
  const lines = [
    `--color-background: var(--background);`,
    `--color-foreground: var(--foreground);`,
    `--color-card: var(--card);`,
    `--color-card-foreground: var(--card-foreground);`,
    `--color-popover: var(--popover);`,
    `--color-popover-foreground: var(--popover-foreground);`,
    `--color-primary: var(--primary);`,
    `--color-primary-foreground: var(--primary-foreground);`,
    `--color-secondary: var(--secondary);`,
    `--color-secondary-foreground: var(--secondary-foreground);`,
    `--color-muted: var(--muted);`,
    `--color-muted-foreground: var(--muted-foreground);`,
    `--color-accent: var(--accent);`,
    `--color-accent-foreground: var(--accent-foreground);`,
    `--color-destructive: var(--destructive);`,
    `--color-destructive-foreground: var(--destructive-foreground);`,
    `--color-border: var(--border);`,
    `--color-input: var(--input);`,
    `--color-ring: var(--ring);`,
    `--color-chart-1: var(--chart-1);`,
    `--color-chart-2: var(--chart-2);`,
    `--color-chart-3: var(--chart-3);`,
    `--color-chart-4: var(--chart-4);`,
    `--color-chart-5: var(--chart-5);`,
    `--color-sidebar: var(--sidebar);`,
    `--color-sidebar-foreground: var(--sidebar-foreground);`,
    `--color-sidebar-primary: var(--sidebar-primary);`,
    `--color-sidebar-primary-foreground: var(--sidebar-primary-foreground);`,
    `--color-sidebar-accent: var(--sidebar-accent);`,
    `--color-sidebar-accent-foreground: var(--sidebar-accent-foreground);`,
    `--color-sidebar-border: var(--sidebar-border);`,
    `--color-sidebar-ring: var(--sidebar-ring);`,
    ``,
    `--font-sans: var(--font-sans);`,
    `--font-mono: var(--font-mono);`,
    `--font-serif: var(--font-serif);`,
    ``,
    `--radius-sm: calc(var(--radius) - 4px);`,
    `--radius-md: calc(var(--radius) - 2px);`,
    `--radius-lg: var(--radius);`,
    `--radius-xl: calc(var(--radius) + 4px);`,
    ``,
    `--shadow-2xs: var(--shadow-2xs);`,
    `--shadow-xs: var(--shadow-xs);`,
    `--shadow-sm: var(--shadow-sm);`,
    `--shadow: var(--shadow);`,
    `--shadow-md: var(--shadow-md);`,
    `--shadow-lg: var(--shadow-lg);`,
    `--shadow-xl: var(--shadow-xl);`,
    `--shadow-2xl: var(--shadow-2xl);`,
  ];

  return `@theme inline {\n${indent(lines)}\n}`;
}

const LAYER_BASE = `@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;

/* ------------------------------------------------------------ */
/* Public API                                                   */
/* ------------------------------------------------------------ */

export function deriveTailwindTheme(
  _domain: string,
  brand?: LiveBrand,
  styleguide?: LiveStyleguide | null,
): string {
  const light = buildPalette(brand, styleguide, "light");
  const dark = buildPalette(brand, styleguide, "dark");
  const fonts = pickFonts(styleguide);
  const radius = pickRadius(styleguide);
  const lightShadows = pickShadows(styleguide, light, "light");
  const darkShadows = pickShadows(styleguide, dark, "dark");
  const spacing = pickSpacing(styleguide);
  const trackingNormal = pickTrackingNormal(styleguide);

  const rootBody = [
    ...paletteLines(light),
    ...nonColorLines(fonts, radius, lightShadows, trackingNormal, spacing),
  ];
  const darkBody = [
    ...paletteLines(dark),
    ...nonColorLines(fonts, radius, darkShadows),
  ];

  return [
    `@import "tailwindcss";`,
    ``,
    `@custom-variant dark (&:is(.dark *));`,
    ``,
    `:root {`,
    indent(rootBody),
    `}`,
    ``,
    `.dark {`,
    indent(darkBody),
    `}`,
    ``,
    themeInlineBlock(),
    ``,
    LAYER_BASE,
    ``,
  ].join("\n");
}

export function deriveCssVariables(
  domain: string,
  brand?: LiveBrand,
  styleguide?: LiveStyleguide | null,
): string {
  const light = buildPalette(brand, styleguide, "light");
  const dark = buildPalette(brand, styleguide, "dark");
  const fonts = pickFonts(styleguide);
  const radius = pickRadius(styleguide);
  const lightShadows = pickShadows(styleguide, light, "light");
  const darkShadows = pickShadows(styleguide, dark, "dark");
  const spacing = pickSpacing(styleguide);
  const trackingNormal = pickTrackingNormal(styleguide);

  const rootBody = [
    ...paletteLines(light),
    ...nonColorLines(fonts, radius, lightShadows, trackingNormal, spacing),
  ];
  const darkBody = [
    ...paletteLines(dark),
    ...nonColorLines(fonts, radius, darkShadows),
  ];

  return [
    `/* ${domain} — design tokens (vanilla CSS) */`,
    `:root {`,
    indent(rootBody),
    `}`,
    ``,
    `.dark {`,
    indent(darkBody),
    `}`,
    ``,
  ].join("\n");
}
