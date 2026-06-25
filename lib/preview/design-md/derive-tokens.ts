/** Verbatim port from designmd-supply. */

export interface LiveColor {
  hex: string;
  name: string | null;
}
export interface LiveBrand {
  colors?: LiveColor[];
}
interface LiveStyleguideButton {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderStyle?: string;
  borderWidth?: string;
  boxShadow?: string;
  color?: string;
  css?: string;
  fontFallbacks?: string[];
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  padding?: string;
}
interface LiveStyleguideCard {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderStyle?: string;
  borderWidth?: string;
  boxShadow?: string;
  css?: string;
  padding?: string;
  textColor?: string;
}
interface LiveStyleguideText {
  fontFallbacks?: string[];
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  letterSpacing?: string;
  lineHeight?: string;
}
interface LiveStyleguideShadows {
  inner?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}
interface LiveStyleguideSpacing {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}
interface LiveStyleguideFontLink {
  type?: "google" | "custom";
  category?: string;
  displayName?: string;
  files?: Record<string, string>;
}
export interface LiveStyleguide {
  mode?: "light" | "dark";
  colors?: { accent?: string; background?: string; text?: string };
  components?: {
    button?: {
      primary?: LiveStyleguideButton;
      secondary?: LiveStyleguideButton;
      link?: LiveStyleguideButton;
    };
    card?: LiveStyleguideCard;
  };
  typography?: {
    headings?: {
      h1?: LiveStyleguideText;
      h2?: LiveStyleguideText;
      h3?: LiveStyleguideText;
      h4?: LiveStyleguideText;
    };
    p?: LiveStyleguideText;
  };
  elementSpacing?: LiveStyleguideSpacing;
  shadows?: LiveStyleguideShadows;
  fontLinks?: Record<string, LiveStyleguideFontLink>;
  raw?: unknown;
}

/* ------------------------------------------------------------ */
/* Color utilities                                              */
/* ------------------------------------------------------------ */

interface RGB {
  r: number;
  g: number;
  b: number;
}

const parseHex = (hex: string | null | undefined): RGB | null => {
  if (!hex) {
    return null;
  }
  const clean = hex.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(clean)) {
    return null;
  }
  if (clean.length === 3) {
    return {
      b: Number.parseInt(clean[2] + clean[2], 16),
      g: Number.parseInt(clean[1] + clean[1], 16),
      r: Number.parseInt(clean[0] + clean[0], 16),
    };
  }
  if (clean.length === 6 || clean.length === 8) {
    return {
      b: Number.parseInt(clean.slice(4, 6), 16),
      g: Number.parseInt(clean.slice(2, 4), 16),
      r: Number.parseInt(clean.slice(0, 2), 16),
    };
  }
  return null;
};

const toHexChannel = (n: number): string =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");

const toHex = (c: RGB): string =>
  `#${toHexChannel(c.r)}${toHexChannel(c.g)}${toHexChannel(c.b)}`;

const mix = (a: RGB, b: RGB, t: number): RGB => ({
  b: a.b + (b.b - a.b) * t,
  g: a.g + (b.g - a.g) * t,
  r: a.r + (b.r - a.r) * t,
});

const WHITE: RGB = { b: 255, g: 255, r: 255 };
const BLACK: RGB = { b: 0, g: 0, r: 0 };

const luminanceComponent = (c: number): number => {
  const s = c / 255;
  return s <= 0.039_28 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ r, g, b }: RGB): number =>
  0.2126 * luminanceComponent(r) +
  0.7152 * luminanceComponent(g) +
  0.0722 * luminanceComponent(b);

const isDark = (c: RGB) => luminance(c) < 0.5;
const readable = (bg: RGB): string => (isDark(bg) ? "#ffffff" : "#0a0a0a");

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

const formatNumber = (n: number, decimals = 4): string => {
  const fixed = n.toFixed(decimals);
  return fixed.replace(/\.?0+$/, "");
};

const rgbToHslToken = ({ r, g, b }: RGB): string => {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rr) {
      h = ((gg - bb) / delta) % 6;
    } else if (max === gg) {
      h = (bb - rr) / delta + 2;
    } else {
      h = (rr - gg) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `hsl(${formatNumber(h, 1)} ${formatNumber(s * 100, 1)}% ${formatNumber(
    l * 100,
    1
  )}%)`;
};

const cssColorPartToChannel = (part: string): number => {
  const n = Number.parseFloat(part);
  return part.endsWith("%") ? (n / 100) * 255 : n;
};

const normalizeCssColor = (
  raw: string | null | undefined
): { color: string; opacity?: number } | null => {
  if (!raw) {
    return null;
  }
  const value = raw.trim();
  const hex = parseHex(value);
  if (hex) {
    return { color: rgbToHslToken(hex) };
  }

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
      const h = Number.parseFloat(parts[0]);
      const s = Number.parseFloat(parts[1]);
      const l = Number.parseFloat(parts[2]);
      let alpha: number | undefined;
      if (alphaPart !== undefined) {
        alpha = Number.parseFloat(alphaPart);
      } else if (parts[3] !== undefined) {
        alpha = Number.parseFloat(parts[3]);
      }
      if ([h, s, l].every(Number.isFinite)) {
        return {
          color: `hsl(${formatNumber(h, 1)} ${formatNumber(s, 1)}% ${formatNumber(
            l,
            1
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
      const color = {
        b: cssColorPartToChannel(parts[2]),
        g: cssColorPartToChannel(parts[1]),
        r: cssColorPartToChannel(parts[0]),
      };
      let alpha: number | undefined;
      if (alphaPart !== undefined) {
        alpha = Number.parseFloat(alphaPart);
      } else if (parts[3] !== undefined) {
        alpha = Number.parseFloat(parts[3]);
      }
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
};

/* ------------------------------------------------------------ */
/* Length utilities                                             */
/* ------------------------------------------------------------ */

const toPx = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }
  const m = value.trim().match(/^(-?\d*\.?\d+)\s*(px|rem|em)?$/i);
  if (!m) {
    return null;
  }
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n)) {
    return null;
  }
  const unit = (m[2] ?? "px").toLowerCase();
  if (unit === "rem" || unit === "em") {
    return n * 16;
  }
  return n;
};

const toPxList = (value: string | null | undefined): number[] => {
  if (!value) {
    return [];
  }
  return value
    .trim()
    .split(/\s+/)
    .map((part) => toPx(part))
    .filter((part): part is number => part !== null && part > 0);
};

const pxToRem = (px: number): string => {
  const rem = px / 16;
  const fixed = rem.toFixed(4);
  return `${fixed.replace(/\.?0+$/, "")}rem`;
};

/* ------------------------------------------------------------ */
/* Font utilities                                               */
/* ------------------------------------------------------------ */

const SANS_FALLBACKS = ["ui-sans-serif", "system-ui", "sans-serif"];
const SERIF_FALLBACKS = ["ui-serif", "Georgia", "serif"];
const MONO_FALLBACKS = ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"];

const quoteIfNeeded = (name: string): string => {
  const trimmed = name.trim().replaceAll(/^["']|["']$/g, "");
  if (!trimmed) {
    return trimmed;
  }
  if (/[^a-zA-Z0-9_-]/.test(trimmed) && !/^[a-z-]+$/.test(trimmed)) {
    return `"${trimmed}"`;
  }
  return trimmed;
};

const buildFontStack = (
  primary: string | undefined,
  fallbacks: string[] | undefined,
  generic: string[]
): string => {
  const seen = new Set<string>();
  const stack: string[] = [];
  const push = (name: string | undefined) => {
    if (!name) {
      return;
    }
    const trimmed = name.trim().replaceAll(/^["']|["']$/g, "");
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    stack.push(quoteIfNeeded(trimmed));
  };
  push(primary);
  for (const fb of fallbacks ?? []) {
    push(fb);
  }
  for (const g of generic) {
    push(g);
  }
  return stack.join(", ");
};

const classifyByFontLinks = (
  family: string,
  fontLinks: Record<string, LiveStyleguideFontLink>
): "sans" | "serif" | "mono" | null => {
  const first = family
    .split(",")[0]
    ?.trim()
    .replaceAll(/^["']|["']$/g, "");
  if (!first || !fontLinks[first]?.category) {
    return null;
  }
  const cat = fontLinks[first].category?.toLowerCase();
  if (cat?.includes("mono")) {
    return "mono";
  }
  if (cat?.includes("serif") && !cat.includes("sans")) {
    return "serif";
  }
  if (
    cat?.includes("sans") ||
    cat?.includes("display") ||
    cat?.includes("hand")
  ) {
    return "sans";
  }
  return null;
};

const classifyByFamilyName = (
  family: string
): "sans" | "serif" | "mono" | null => {
  const lower = family.toLowerCase();
  const stripped = lower.replaceAll("sans-serif", "");
  if (/\b(monospace|mono)\b/.test(lower)) {
    return "mono";
  }
  if (/\bserif\b/.test(stripped)) {
    return "serif";
  }
  if (/\bsans-serif\b/.test(lower)) {
    return "sans";
  }
  return null;
};

const classifyFamily = (
  family: string | undefined,
  fontLinks: Record<string, LiveStyleguideFontLink> | undefined
): "sans" | "serif" | "mono" | "unknown" => {
  if (!family) {
    return "unknown";
  }
  if (fontLinks) {
    const fromLinks = classifyByFontLinks(family, fontLinks);
    if (fromLinks) {
      return fromLinks;
    }
  }
  return classifyByFamilyName(family) ?? "unknown";
};

const findMonoFamily = (
  fontLinks: Record<string, LiveStyleguideFontLink> | undefined
): string | undefined => {
  if (!fontLinks) {
    return undefined;
  }
  for (const [name, link] of Object.entries(fontLinks)) {
    if (link.category?.toLowerCase().includes("mono")) {
      return name;
    }
  }
  return undefined;
};

const findSerifFamily = (
  fontLinks: Record<string, LiveStyleguideFontLink> | undefined,
  exclude: Set<string>
): string | undefined => {
  if (!fontLinks) {
    return undefined;
  }
  for (const [name, link] of Object.entries(fontLinks)) {
    if (exclude.has(name.toLowerCase())) {
      continue;
    }
    const cat = link.category?.toLowerCase() ?? "";
    if (cat.includes("serif") && !cat.includes("sans")) {
      return name;
    }
  }
  return undefined;
};

interface FontTokens {
  sans: string;
  serif: string;
  mono: string;
}

const findSerifFromHeadings = (
  headings: (LiveStyleguideText | undefined)[],
  links: Record<string, LiveStyleguideFontLink> | undefined,
  used: Set<string>
): string | undefined => {
  for (const head of headings) {
    const fam = head?.fontFamily;
    if (!fam || used.has(fam.toLowerCase())) {
      continue;
    }
    if (classifyFamily(fam, links) === "serif") {
      return buildFontStack(fam, head?.fontFallbacks, SERIF_FALLBACKS);
    }
  }
  return undefined;
};

interface ResolvedTypography {
  body: LiveStyleguideText | undefined;
  headings: (LiveStyleguideText | undefined)[];
  links: Record<string, LiveStyleguideFontLink> | undefined;
}

const resolveTypography = (
  styleguide: LiveStyleguide | null | undefined
): ResolvedTypography => ({
  body: styleguide?.typography?.p,
  headings: [
    styleguide?.typography?.headings?.h1,
    styleguide?.typography?.headings?.h2,
    styleguide?.typography?.headings?.h3,
  ],
  links: styleguide?.fontLinks,
});

const pickFonts = (
  styleguide: LiveStyleguide | null | undefined
): FontTokens => {
  const { body, headings, links } = resolveTypography(styleguide);
  const [h1] = headings;

  const sansFamily = body?.fontFamily ?? h1?.fontFamily;
  const sansFallbacks = body?.fontFallbacks ?? h1?.fontFallbacks;
  const sans = buildFontStack(sansFamily, sansFallbacks, SANS_FALLBACKS);

  const used = new Set<string>();
  if (sansFamily) {
    used.add(sansFamily.toLowerCase());
  }

  const serif =
    findSerifFromHeadings(headings, links, used) ??
    findSerifFamily(links, used);

  const monoFamily = findMonoFamily(links);
  const mono = buildFontStack(monoFamily, undefined, MONO_FALLBACKS);

  return {
    mono,
    sans,
    serif: serif ?? buildFontStack(undefined, undefined, SERIF_FALLBACKS),
  };
};

/* ------------------------------------------------------------ */
/* Radius / shadows / spacing                                   */
/* ------------------------------------------------------------ */

const MIN_SPACING_PX = 3.5;
const DEFAULT_SPACING_PX = 4;
const MAX_SPACING_PX = 5;

const pickRadius = (styleguide: LiveStyleguide | null | undefined): string => {
  const cardRadius = toPx(styleguide?.components?.card?.borderRadius);
  const buttonRadius = toPx(
    styleguide?.components?.button?.primary?.borderRadius
  );
  const px = cardRadius ?? buttonRadius;
  if (px === null) {
    return "0.5rem";
  }
  const clamped = Math.min(Math.max(px, 2), 16);
  return pxToRem(clamped);
};

interface ShadowTokens {
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
}

interface ParsedShadow {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color?: string;
  opacity?: number;
}

const normalizePxToken = (
  value: string | undefined,
  fallback: string
): string => {
  const px = toPx(value);
  if (px === null) {
    return fallback;
  }
  return `${formatNumber(px, 2)}px`;
};

const splitShadowLayers = (value: string): string[] => {
  const layers: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === "(") {
      depth += 1;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
    }
    if (ch === "," && depth === 0) {
      layers.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  layers.push(value.slice(start).trim());
  return layers.filter(Boolean);
};

const findColorSnippet = (layer: string): string | null => {
  const functional = layer.match(/\b(?:rgba?|hsla?)\([^)]+\)/i);
  if (functional) {
    return functional[0];
  }
  const hex = layer.match(/#[0-9a-f]{3,8}\b/i);
  return hex?.[0] ?? null;
};

const parseBoxShadow = (
  value: string | null | undefined
): ParsedShadow | null => {
  if (!value || value.trim().toLowerCase() === "none") {
    return null;
  }
  const [layer] = splitShadowLayers(value);
  if (!layer) {
    return null;
  }

  const colorSnippet = findColorSnippet(layer);
  const color = normalizeCssColor(colorSnippet);
  const withoutColor = colorSnippet ? layer.replace(colorSnippet, " ") : layer;
  const lengths = withoutColor
    .replaceAll(/\binset\b/gi, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => toPx(part) !== null);

  if (lengths.length < 2) {
    return null;
  }

  return {
    blur: normalizePxToken(lengths[2], "3px"),
    color: color?.color,
    opacity: color?.opacity,
    spread: normalizePxToken(lengths[3], "0px"),
    x: normalizePxToken(lengths[0], "0px"),
    y: normalizePxToken(lengths[1], "2px"),
  };
};

const colorWithOpacity = (color: string, opacity: number): string => {
  const alpha = formatNumber(clamp(opacity, 0, 1), 4);
  const hsl = color.match(/^hsl\((.+)\)$/i);
  if (hsl) {
    return `hsl(${hsl[1]} / ${alpha})`;
  }
  const rgb = color.match(/^rgb\((.+)\)$/i);
  if (rgb) {
    return `rgb(${rgb[1]} / ${alpha})`;
  }
  return color;
};

const fallbackShadowColor = (
  palette: Palette,
  mode: "light" | "dark"
): string => {
  const bg = parseHex(palette.background);
  const fg = parseHex(palette.foreground);
  if (mode === "dark") {
    return "hsl(0 0% 5%)";
  }
  if (bg && fg) {
    return rgbToHslToken(mix(fg, bg, 0.15));
  }
  return fg ? rgbToHslToken(fg) : "hsl(0 0% 5%)";
};

const buildShadowTokens = (base: {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  opacity: number;
}): ShadowTokens => {
  const half = base.opacity * 0.5;
  const heavy = Math.min(base.opacity * 2.5, 0.75);
  const main = colorWithOpacity(base.color, base.opacity);
  const quiet = colorWithOpacity(base.color, half);
  const loud = colorWithOpacity(base.color, heavy);
  const first = `${base.x} ${base.y} ${base.blur} ${base.spread}`;
  const second = (y: string, blur: string, spread: string) =>
    `${base.x} ${y} ${blur} ${spread}`;

  return {
    base: `${first} ${main}, ${second("1px", "2px", "-1px")} ${main}`,
    blur: base.blur,
    color: base.color,
    lg: `${first} ${main}, ${second("4px", "6px", "-1px")} ${main}`,
    md: `${first} ${main}, ${second("2px", "4px", "-1px")} ${main}`,
    opacity: formatNumber(base.opacity, 4),
    shadow2xl: `${first} ${loud}`,
    shadow2xs: `${first} ${quiet}`,
    sm: `${first} ${main}, ${second("1px", "2px", "-1px")} ${main}`,
    spread: base.spread,
    x: base.x,
    xl: `${first} ${main}, ${second("8px", "10px", "-1px")} ${main}`,
    xs: `${first} ${quiet}`,
    y: base.y,
  };
};

const collectShadowCandidates = (
  styleguide: LiveStyleguide | null | undefined
): (string | undefined)[] => {
  const s = styleguide?.shadows;
  return [
    s?.md,
    styleguide?.components?.card?.boxShadow,
    styleguide?.components?.button?.primary?.boxShadow,
    s?.sm,
    s?.lg,
    s?.xl,
  ];
};

const pickShadows = (
  styleguide: LiveStyleguide | null | undefined,
  palette: Palette,
  mode: "light" | "dark"
): ShadowTokens => {
  const candidates = collectShadowCandidates(styleguide);
  const parsed = candidates.map(parseBoxShadow).find(Boolean);

  return buildShadowTokens({
    blur: parsed?.blur ?? "3px",
    color: parsed?.color ?? fallbackShadowColor(palette, mode),
    opacity: parsed?.opacity ?? 0.18,
    spread: parsed?.spread ?? "0px",
    x: parsed?.x ?? "0px",
    y: parsed?.y ?? "2px",
  });
};

const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
};

const pickSpacing = (styleguide: LiveStyleguide | null | undefined): string => {
  const sp = styleguide?.elementSpacing;
  const scaleCandidates = [
    toPx(sp?.xs),
    toPx(sp?.sm),
    toPx(sp?.md),
    toPx(sp?.lg),
    toPx(sp?.xl),
  ]
    .filter((value): value is number => value !== null && value > 0)
    .map((value, index) => {
      if (index === 0) {
        return value;
      }
      return value / ((index + 1) * 2);
    });

  const componentPadding = [
    styleguide?.components?.button?.primary?.padding,
    styleguide?.components?.button?.secondary?.padding,
    styleguide?.components?.card?.padding,
  ].flatMap((value) => toPxList(value));
  const paddingCandidates = componentPadding.map((value) => value / 4);

  const picked =
    median([...scaleCandidates, ...paddingCandidates]) ?? DEFAULT_SPACING_PX;
  const safeUnit = clamp(
    Math.round(picked * 2) / 2,
    MIN_SPACING_PX,
    MAX_SPACING_PX
  );
  return pxToRem(safeUnit);
};

const pickTrackingNormal = (
  styleguide: LiveStyleguide | null | undefined
): string => {
  const values = [
    styleguide?.typography?.p?.letterSpacing,
    styleguide?.typography?.headings?.h1?.letterSpacing,
  ];
  const value = values.find((v) => v && v.trim().toLowerCase() !== "normal");
  if (!value) {
    return "0em";
  }
  const trimmed = value.trim();
  const m = trimmed.match(/^(-?\d*\.?\d+)\s*(px|rem|em)?$/i);
  if (!m) {
    return trimmed;
  }
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n)) {
    return "0em";
  }
  const unit = (m[2] ?? "em").toLowerCase();
  if (unit === "px") {
    return `${formatNumber(n / 16, 4)}em`;
  }
  return `${formatNumber(n, 4)}em`;
};

/* ------------------------------------------------------------ */
/* Palette                                                      */
/* ------------------------------------------------------------ */

interface Palette {
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
}

interface PaletteSource {
  brandColors: RGB[];
  sourceAccent: RGB | null;
  sgPrimaryBg: RGB | null;
  sgPrimaryFg: RGB | null;
  sgSecondaryBg: RGB | null;
  sgSecondaryFg: RGB | null;
  sgBg: RGB | null;
  sgFg: RGB | null;
  sgCardBg: RGB | null;
  sgCardFg: RGB | null;
  sgCardBorder: RGB | null;
  sgBtnBorder: RGB | null;
}

const parseBrandColors = (
  brand: LiveBrand | undefined
): { brandColors: RGB[]; namedBrandAccent: RGB | null } => {
  const brandColors = (brand?.colors ?? [])
    .map((c) => parseHex(c.hex))
    .filter((c): c is RGB => c !== null);
  const namedBrandAccent = parseHex(
    (brand?.colors ?? []).find((color) =>
      /accent|secondary|highlight|support/i.test(color.name ?? "")
    )?.hex
  );
  return { brandColors, namedBrandAccent };
};

const resolveStyleguideButtons = (
  styleguide: LiveStyleguide | null | undefined
) => {
  const btnPrimary = styleguide?.components?.button?.primary;
  const btnSecondary = styleguide?.components?.button?.secondary;
  const btnLink = styleguide?.components?.button?.link;
  return {
    btnLinkAccent: parseHex(btnLink?.backgroundColor ?? btnLink?.color),
    btnPrimary,
    btnSecondary,
    sgBtnBorder: parseHex(btnSecondary?.borderColor ?? btnPrimary?.borderColor),
    sgPrimaryBg: parseHex(btnPrimary?.backgroundColor),
    sgPrimaryFg: parseHex(btnPrimary?.color),
    sgSecondaryBg: parseHex(btnSecondary?.backgroundColor),
    sgSecondaryFg: parseHex(btnSecondary?.color),
  };
};

const resolveStyleguideCard = (
  styleguide: LiveStyleguide | null | undefined
) => ({
  sgCardBg: parseHex(styleguide?.components?.card?.backgroundColor),
  sgCardBorder: parseHex(styleguide?.components?.card?.borderColor),
  sgCardFg: parseHex(styleguide?.components?.card?.textColor),
});

const extractPaletteSource = (
  brand: LiveBrand | undefined,
  styleguide: LiveStyleguide | null | undefined
): PaletteSource => {
  const { brandColors, namedBrandAccent } = parseBrandColors(brand);
  const sgAccent = parseHex(styleguide?.colors?.accent);
  const { btnLinkAccent, sgBtnBorder, ...buttons } =
    resolveStyleguideButtons(styleguide);
  const card = resolveStyleguideCard(styleguide);

  const sourceAccent =
    sgAccent ?? btnLinkAccent ?? namedBrandAccent ?? brandColors[1] ?? null;

  return {
    brandColors,
    sgBg: parseHex(styleguide?.colors?.background),
    sgBtnBorder,
    ...card,
    sgFg: parseHex(styleguide?.colors?.text),
    ...buttons,
    sourceAccent,
  };
};

const adjustContrast = (
  base: RGB,
  mode: "light" | "dark",
  amount: number,
  darkMix: RGB,
  lightMix: RGB
): RGB => {
  if (mode === "dark" && isDark(base)) {
    return mix(base, darkMix, amount);
  }
  if (mode === "light" && !isDark(base)) {
    return mix(base, lightMix, amount);
  }
  return base;
};

const buildDirectPalette = (
  src: PaletteSource,
  mode: "light" | "dark"
): {
  background: RGB;
  foreground: RGB;
  primary: RGB;
  primaryForeground: RGB | null;
  secondary: RGB;
  secondaryForeground: RGB | null;
  accent: RGB;
  cardBg: RGB;
  cardFg: RGB | null;
  border: RGB | null;
} => {
  const background =
    src.sgBg ?? (mode === "light" ? WHITE : { b: 21, g: 23, r: 23 });
  const foreground =
    src.sgFg ??
    (mode === "light" ? { b: 10, g: 10, r: 10 } : { b: 244, g: 245, r: 245 });
  const primary =
    src.sgPrimaryBg ?? src.brandColors[0] ?? src.sourceAccent ?? foreground;
  const primaryForeground = src.sgPrimaryBg ? src.sgPrimaryFg : null;
  const accent = src.sourceAccent ?? primary;
  const secondary =
    src.sgSecondaryBg ??
    (src.sourceAccent ? mix(background, src.sourceAccent, 0.16) : undefined) ??
    mix(background, primary, 0.18);
  const secondaryForeground = src.sgSecondaryBg ? src.sgSecondaryFg : null;
  const cardBg = src.sgCardBg ?? mix(background, foreground, 0.03);
  const cardFg = src.sgCardFg;
  const border = src.sgCardBorder ?? src.sgBtnBorder;

  return {
    accent,
    background,
    border,
    cardBg,
    cardFg,
    foreground,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
  };
};

const buildInvertedPalette = (
  src: PaletteSource,
  mode: "light" | "dark"
): {
  background: RGB;
  foreground: RGB;
  primary: RGB;
  primaryForeground: RGB | null;
  secondary: RGB;
  secondaryForeground: RGB | null;
  accent: RGB;
  cardBg: RGB;
  cardFg: RGB | null;
  border: RGB | null;
} => {
  let background: RGB;
  let foreground: RGB;
  if (mode === "light") {
    background = WHITE;
    foreground = { b: 10, g: 10, r: 10 };
  } else {
    background = { b: 21, g: 23, r: 23 };
    foreground = { b: 244, g: 245, r: 245 };
  }

  const basePrimary =
    src.sgPrimaryBg ?? src.brandColors[0] ?? src.sourceAccent ?? foreground;
  const primary = adjustContrast(basePrimary, mode, 0.3, WHITE, BLACK);

  const baseAccent = src.sourceAccent ?? primary;
  const accent = adjustContrast(baseAccent, mode, 0.25, WHITE, BLACK);

  const secondary =
    src.sgSecondaryBg ??
    mix(background, accent, mode === "light" ? 0.16 : 0.24) ??
    mix(background, primary, 0.18);
  const secondaryForeground = src.sgSecondaryBg ? src.sgSecondaryFg : null;
  const cardBg = mix(background, foreground, mode === "light" ? 0.03 : 0.07);

  return {
    accent,
    background,
    border: null,
    cardBg,
    cardFg: null,
    foreground,
    primary,
    primaryForeground: src.sgPrimaryBg ? src.sgPrimaryFg : null,
    secondary,
    secondaryForeground,
  };
};

const buildChartColors = (
  accent: RGB,
  primary: RGB,
  secondary: RGB,
  brandColors: RGB[]
): [RGB, RGB, RGB, RGB, RGB] => {
  const candidates = [accent, primary, secondary, ...brandColors];
  const seen = new Set<string>();
  const unique = candidates.filter((color) => {
    const hex = toHex(color);
    if (seen.has(hex)) {
      return false;
    }
    seen.add(hex);
    return true;
  });
  return [
    unique[0] ?? primary,
    unique[1] ?? mix(primary, WHITE, 0.3),
    unique[2] ?? mix(primary, BLACK, 0.25),
    unique[3] ?? mix(primary, WHITE, 0.55),
    unique[4] ?? mix(primary, BLACK, 0.45),
  ];
};

const buildPalette = (
  brand: LiveBrand | undefined,
  styleguide: LiveStyleguide | null | undefined,
  mode: "light" | "dark"
): Palette => {
  const sgMode = styleguide?.mode;
  const sourceIsLight = sgMode !== "dark";
  const direct = mode === (sourceIsLight ? "light" : "dark");

  const src = extractPaletteSource(brand, styleguide);

  const palette = direct
    ? buildDirectPalette(src, mode)
    : buildInvertedPalette(src, mode);

  const { background, foreground, primary, primaryForeground, accent } =
    palette;

  const muted = mix(background, foreground, mode === "light" ? 0.05 : 0.1);
  const mutedFg = mix(foreground, background, 0.4);
  const finalBorder =
    palette.border ??
    mix(background, foreground, mode === "light" ? 0.12 : 0.2);
  const sidebar = mix(background, foreground, mode === "light" ? 0.04 : 0.05);
  const chart = buildChartColors(
    accent,
    primary,
    palette.secondary,
    src.brandColors
  );

  return {
    accent: toHex(accent),
    accentForeground: readable(accent),
    background: toHex(background),
    border: toHex(finalBorder),
    card: toHex(palette.cardBg),
    cardForeground: toHex(palette.cardFg ?? foreground),
    chart: chart.map(toHex) as [string, string, string, string, string],
    destructive: mode === "light" ? "#dc2626" : "#ef4444",
    destructiveForeground: "#ffffff",
    foreground: toHex(foreground),
    input: toHex(finalBorder),
    muted: toHex(muted),
    mutedForeground: toHex(mutedFg),
    popover: toHex(palette.cardBg),
    popoverForeground: toHex(palette.cardFg ?? foreground),
    primary: toHex(primary),
    primaryForeground: primaryForeground
      ? toHex(primaryForeground)
      : readable(primary),
    ring: toHex(accent),
    secondary: toHex(palette.secondary),
    secondaryForeground: palette.secondaryForeground
      ? toHex(palette.secondaryForeground)
      : readable(palette.secondary),
    sidebar: toHex(sidebar),
    sidebarAccent: toHex(accent),
    sidebarAccentForeground: readable(accent),
    sidebarBorder: toHex(finalBorder),
    sidebarForeground: toHex(foreground),
    sidebarPrimary: toHex(primary),
    sidebarPrimaryForeground: primaryForeground
      ? toHex(primaryForeground)
      : readable(primary),
    sidebarRing: toHex(accent),
  };
};

/* ------------------------------------------------------------ */
/* Output formatting                                            */
/* ------------------------------------------------------------ */

const paletteLines = (p: Palette): string[] => [
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

const nonColorLines = (
  fonts: FontTokens,
  radius: string,
  shadows: ShadowTokens,
  trackingNormal?: string,
  spacing?: string
): string[] => {
  const lines: string[] = [
    `--font-sans: ${fonts.sans};`,
    `--font-serif: ${fonts.serif};`,
    `--font-mono: ${fonts.mono};`,
    `--radius: ${radius};`,
    `--shadow-x: ${shadows.x};`,
    `--shadow-y: ${shadows.y};`,
    `--shadow-blur: ${shadows.blur};`,
    `--shadow-spread: ${shadows.spread};`,
    `--shadow-opacity: ${shadows.opacity};`,
    `--shadow-color: ${shadows.color};`,
    `--shadow-2xs: ${shadows.shadow2xs};`,
    `--shadow-xs: ${shadows.xs};`,
    `--shadow-sm: ${shadows.sm};`,
    `--shadow: ${shadows.base};`,
    `--shadow-md: ${shadows.md};`,
    `--shadow-lg: ${shadows.lg};`,
    `--shadow-xl: ${shadows.xl};`,
    `--shadow-2xl: ${shadows.shadow2xl};`,
  ];
  if (trackingNormal) {
    lines.push(`--tracking-normal: ${trackingNormal};`);
  }
  if (spacing) {
    lines.push(`--spacing: ${spacing};`);
  }

  return lines;
};

const indent = (lines: string[]): string =>
  lines.map((l) => `  ${l}`).join("\n");

const themeInlineBlock = (): string => {
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
};

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

export const deriveTailwindTheme = (
  _domain: string,
  brand?: LiveBrand,
  styleguide?: LiveStyleguide | null
): string => {
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
};

export const deriveCssVariables = (
  domain: string,
  brand?: LiveBrand,
  styleguide?: LiveStyleguide | null
): string => {
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
};
