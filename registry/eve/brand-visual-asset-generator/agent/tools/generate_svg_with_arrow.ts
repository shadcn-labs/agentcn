import { generateImage, NoImageGeneratedError } from "ai";
import { defineTool } from "eve/tools";
import { z } from "zod";

const ARROW_MODEL = "quiverai/arrow-1.1";
const RESPONSE_PREVIEW_LENGTH = 1200;
const MAX_ARROW_REFERENCES = 4;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const MIN_ACCENT_LIGHTNESS = 0.15;
const MAX_ACCENT_LIGHTNESS = 0.9;
const MIN_ACCENT_SATURATION = 0.25;

const referenceImageSchema = z.union([
  z.object({
    url: z
      .string()
      .url()
      .refine(isHttpUrl, {
        message: "Reference image URL must use http or https.",
      })
      .describe("Public HTTP(S) image URL to use as a style or composition reference."),
  }),
  z.object({
    base64: z
      .string()
      .min(1)
      .refine(isBase64Payload, {
        message: "Reference image must be a standard base64 payload.",
      })
      .describe("Base64-encoded PNG, JPEG, WebP, GIF, or SVG reference image payload."),
  }),
]);

const inputSchema = z.object({
  filename: z
    .string()
    .min(1)
    .describe("Suggested SVG filename, for example feature-hero.svg."),
  assetType: z
    .string()
    .min(1)
    .describe("Asset type, for example hero illustration, icon, badge, or empty state."),
  brief: z
    .string()
    .min(20)
    .describe("Self-contained creative brief with brand profile, subject, style notes, and constraints."),
  dimensions: z
    .string()
    .min(1)
    .describe("Intended dimensions or viewBox, for example 1200x720 or 0 0 64 64."),
  referenceImages: z
    .array(referenceImageSchema)
    .max(MAX_ARROW_REFERENCES)
    .optional()
    .describe(
      "Optional Quiver reference images for style, palette, composition, or typography. Arrow 1.1 supports up to 4.",
    ),
});

type GenerateSvgInput = z.infer<typeof inputSchema>;
type ReferenceImageInput = z.infer<typeof referenceImageSchema>;
type QuiverReference = { base64: string } | { url: string };

type GenerateSvgOutput =
  | {
      byteLength: number;
      filename: string;
      mediaType: "image/svg+xml";
      model: typeof ARROW_MODEL;
      ok: true;
      revisedPrompt?: string;
      svg: string;
    }
  | {
      error: string;
      filename: string;
      missingEnv?: "AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN";
      ok: false;
      responsePreview?: string;
      status?: number;
    };

export default defineTool({
  description:
    "Generate one editable SVG asset by calling the Quiver Arrow image model through Vercel AI Gateway. Use once per finalized asset brief.",
  inputSchema,
  async execute(input): Promise<GenerateSvgOutput> {
    const credential = readGatewayCredential();
    if (!credential) {
      return {
        ok: false,
        filename: input.filename,
        error:
          "AI Gateway credentials are required to call quiverai/arrow-1.1. Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN.",
        missingEnv: "AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN",
      };
    }

    const prompt = buildPrompt(input);
    const generatedSvg = await generateSvgWithGateway({
      prompt,
      referenceImages: input.referenceImages,
    });
    if (!generatedSvg.ok) {
      return {
        ok: false,
        filename: input.filename,
        error: generatedSvg.error,
        responsePreview: generatedSvg.responsePreview,
      };
    }

    const rawSvg = generatedSvg.svg;
    if (!looksLikeSvg(rawSvg)) {
      return {
        ok: false,
        filename: input.filename,
        error: "Quiver Arrow returned data that does not look like SVG markup.",
        responsePreview: preview(rawSvg),
      };
    }

    if (!hasViewBox(rawSvg)) {
      return {
        ok: false,
        filename: input.filename,
        error: "Quiver Arrow returned SVG markup without a viewBox.",
        responsePreview: preview(rawSvg),
      };
    }

    if (hasUnsafeSvgContent(rawSvg)) {
      return {
        ok: false,
        filename: input.filename,
        error: "Quiver Arrow returned SVG markup with raster or active content.",
        responsePreview: preview(rawSvg),
      };
    }

    const normalizedSvg = normalizeViewBox(rawSvg, input);
    const themeableSvg = enforceThemeableIconSvg(normalizedSvg, input);
    const svg = ensureAccessibleSvg(themeableSvg, input);
    return {
      ok: true,
      filename: input.filename,
      model: ARROW_MODEL,
      mediaType: "image/svg+xml",
      byteLength: Buffer.byteLength(svg, "utf8"),
      svg,
    };
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: output,
    };
  },
});

function readGatewayCredential(): string | undefined {
  return (
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim()
  );
}

function buildPrompt(input: GenerateSvgInput): string {
  return [
    JSON.stringify(
      {
        subject: input.brief,
        intended_use: `${input.assetType} saved as ${input.filename}`,
        style:
          "Production-ready SVG/vector output. Use one clear vector concept, clean geometry, and deliberate negative space.",
        composition: `Fit ${input.dimensions}. Prefer a simple, balanced composition over dense UI mockups or many small details.`,
        color_palette:
          "Use only colors named in the brief. For icons, use currentColor for strokes and no fixed fills except one purposeful accent if requested.",
        typography:
          "Avoid text unless the brief explicitly requires exact copy. If text is required, keep it short and optically centered.",
        preserve_from_reference:
          "When referenceImages are provided, preserve the reference style, color relationships, composition, and typography direction.",
        change_from_reference:
          "Change only the subject, dimensions, and asset-specific details requested in the brief.",
        constraints:
          "Return complete editable SVG markup only. Include viewBox, title, desc, and semantic group ids. Do not embed raster images. Avoid generic SaaS filler such as globes, random node networks, decorative dot grids, and disconnected floating dashboards.",
      },
      null,
      2,
    ),
  ].join("\n");
}

async function generateSvgWithGateway({
  prompt,
  referenceImages,
}: {
  prompt: string;
  referenceImages?: ReferenceImageInput[];
}): Promise<{ ok: true; svg: string } | { error: string; ok: false; responsePreview?: string }> {
  try {
    const { image } = await generateImage({
      model: ARROW_MODEL,
      prompt: buildImagePrompt({ prompt, referenceImages }),
      n: 1,
      providerOptions: {
        quiverai: {
          operation: "generate",
          instructions:
            "Return a complete SVG document only. The SVG must be editable markup, not raster data.",
          maxOutputTokens: 6000,
          references: normalizeReferenceImages(referenceImages),
          temperature: 0.45,
          topP: 0.9,
        },
      },
    });

    return {
      ok: true,
      svg: new TextDecoder().decode(image.uint8Array).trim(),
    };
  } catch (error) {
    if (NoImageGeneratedError.isInstance(error)) {
      return {
        ok: false,
        error: "AI Gateway did not return SVG image data.",
        responsePreview: preview(String(error.cause ?? error.message)),
      };
    }

    return {
      ok: false,
      error: "Quiver Arrow SVG generation failed through AI Gateway.",
      responsePreview: preview(errorMessage(error)),
    };
  }
}

function buildImagePrompt({
  prompt,
  referenceImages,
}: {
  prompt: string;
  referenceImages?: ReferenceImageInput[];
}): string | { images: string[]; text: string } {
  const base64Images =
    referenceImages?.flatMap((referenceImage) =>
      "base64" in referenceImage ? [referenceImage.base64] : [],
    ) ?? [];

  if (base64Images.length === 0) {
    return prompt;
  }

  return {
    text: prompt,
    images: base64Images,
  };
}

function normalizeReferenceImages(
  referenceImages: ReferenceImageInput[] | undefined,
): QuiverReference[] | undefined {
  if (!referenceImages || referenceImages.length === 0) {
    return undefined;
  }

  return referenceImages.map((referenceImage) => {
    if ("url" in referenceImage) {
      return { url: referenceImage.url };
    }

    return { base64: referenceImage.base64 };
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function looksLikeSvg(value: string): boolean {
  return value.includes("<svg") && value.includes("</svg>");
}

function hasViewBox(value: string): boolean {
  return /\sviewBox\s*=/iu.test(value);
}

function hasUnsafeSvgContent(svg: string): boolean {
  return (
    /<\s*(script|foreignObject|iframe|object|embed|image)\b/iu.test(svg) ||
    /\son[a-z]+\s*=/iu.test(svg) ||
    /\b(?:href|xlink:href)\s*=\s*["']\s*(?:javascript:|data:(?!image\/svg\+xml)|https?:\/\/|\/\/)/iu.test(svg)
  );
}

type ViewBox = {
  height: number;
  minX: number;
  minY: number;
  width: number;
};

function normalizeViewBox(
  svg: string,
  input: z.infer<typeof inputSchema>,
): string {
  const targetViewBox = parseTargetViewBox(input.dimensions);
  const sourceViewBox = parseSvgViewBox(svg);

  if (!targetViewBox || !sourceViewBox || sameViewBox(sourceViewBox, targetViewBox)) {
    return svg;
  }

  const innerSvg = extractInnerSvg(svg);
  if (!innerSvg) {
    return svg;
  }

  const scale = Math.min(
    targetViewBox.width / sourceViewBox.width,
    targetViewBox.height / sourceViewBox.height,
  );
  const scaledWidth = sourceViewBox.width * scale;
  const scaledHeight = sourceViewBox.height * scale;
  const translateX =
    targetViewBox.minX +
    (targetViewBox.width - scaledWidth) / 2 -
    sourceViewBox.minX * scale;
  const translateY =
    targetViewBox.minY +
    (targetViewBox.height - scaledHeight) / 2 -
    sourceViewBox.minY * scale;
  const transform = `translate(${formatNumber(translateX)} ${formatNumber(translateY)}) scale(${formatNumber(scale)})`;
  const outerTag = buildSvgOpeningTag(svg, targetViewBox);

  return `${outerTag}\n<g id="arrow-generated-artwork" transform="${transform}">\n${innerSvg.trim()}\n</g>\n</svg>`;
}

function parseTargetViewBox(value: string): ViewBox | undefined {
  const viewBoxParts = value
    .trim()
    .split(/\s+/u)
    .map((part) => Number(part));

  if (viewBoxParts.length === 4 && viewBoxParts.every(Number.isFinite)) {
    const [minX, minY, width, height] = viewBoxParts;
    if (width > 0 && height > 0) {
      return { height, minX, minY, width };
    }
  }

  const sizeMatch = /^(?<width>\d+(?:\.\d+)?)x(?<height>\d+(?:\.\d+)?)$/iu.exec(
    value.trim(),
  );
  if (!sizeMatch?.groups) {
    return undefined;
  }

  const width = Number(sizeMatch.groups.width);
  const height = Number(sizeMatch.groups.height);
  if (!(width > 0 && height > 0)) {
    return undefined;
  }

  return { height, minX: 0, minY: 0, width };
}

function parseSvgViewBox(svg: string): ViewBox | undefined {
  const match = /\sviewBox\s*=\s*["']([^"']+)["']/iu.exec(svg);
  if (!match?.[1]) {
    return undefined;
  }

  return parseTargetViewBox(match[1]);
}

function sameViewBox(left: ViewBox, right: ViewBox): boolean {
  return (
    left.minX === right.minX &&
    left.minY === right.minY &&
    left.width === right.width &&
    left.height === right.height
  );
}

function extractInnerSvg(svg: string): string | undefined {
  const match = /<svg\b[^>]*>([\s\S]*?)<\/svg>/iu.exec(svg);
  return match?.[1];
}

function buildSvgOpeningTag(svg: string, viewBox: ViewBox): string {
  const openingMatch = /<svg\b[^>]*>/iu.exec(svg);
  const openingTag = openingMatch?.[0] ?? '<svg xmlns="http://www.w3.org/2000/svg">';
  const withoutSizing = openingTag
    .replace(/\sviewBox\s*=\s*["'][^"']*["']/iu, "")
    .replace(/\s(width|height)\s*=\s*["'][^"']*["']/giu, "");

  return withoutSizing.replace(
    /<svg\b/iu,
    `<svg viewBox="${formatViewBox(viewBox)}"`,
  );
}

function formatViewBox(viewBox: ViewBox): string {
  return [
    formatNumber(viewBox.minX),
    formatNumber(viewBox.minY),
    formatNumber(viewBox.width),
    formatNumber(viewBox.height),
  ].join(" ");
}

function formatNumber(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function ensureAccessibleSvg(
  svg: string,
  input: z.infer<typeof inputSchema>,
): string {
  const additions: string[] = [];

  if (!/<title\b/iu.test(svg)) {
    additions.push(`<title>${escapeXml(svgTitle(input.filename))}</title>`);
  }

  if (!/<desc\b/iu.test(svg)) {
    additions.push(`<desc>${escapeXml(svgDescription(input))}</desc>`);
  }

  if (additions.length === 0) {
    return svg;
  }

  return svg.replace(/<svg\b[^>]*>/iu, (openingTag) =>
    [openingTag, ...additions].join("\n"),
  );
}

function enforceThemeableIconSvg(
  svg: string,
  input: z.infer<typeof inputSchema>,
): string {
  if (!isIconAsset(input)) {
    return svg;
  }

  return addIconRootDefaults(
    addStrokeToUnstyledIconPaths(
      svg
        .replace(/\bstroke\s*:\s*#[0-9a-f]{3,8}\b/giu, "stroke:currentColor")
        .replace(/\bstroke\s*=\s*(["'])#[0-9a-f]{3,8}\b\1/giu, 'stroke="currentColor"')
        .replace(/\bfill\s*:\s*url\([^)]*\)/giu, "fill:none")
        .replace(/\bfill\s*=\s*(["'])url\([^)]*\)\1/giu, 'fill="none"')
        .replace(/\bfill\s*:\s*(#[0-9a-f]{3,8})\b/giu, (_, color: string) =>
          isAccentColor(color) ? `fill:${color}` : "fill:none",
        )
        .replace(/\bfill\s*=\s*(["'])(#[0-9a-f]{3,8})\b\1/giu, (_, quote: string, color: string) =>
          isAccentColor(color) ? `fill=${quote}${color}${quote}` : `fill=${quote}none${quote}`,
        ),
    ),
  );
}

function isIconAsset(input: z.infer<typeof inputSchema>): boolean {
  const targetViewBox = parseTargetViewBox(input.dimensions);
  const isSmallViewBox =
    targetViewBox !== undefined &&
    targetViewBox.width <= 64 &&
    targetViewBox.height <= 64;

  return /\bicon\b/iu.test(input.assetType) || isSmallViewBox;
}

function addIconRootDefaults(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/iu, (openingTag: string, attributes: string) => {
    const withFill = /\sfill\s*=/iu.test(attributes)
      ? openingTag
      : openingTag.replace(/>$/u, ' fill="none">');
    return /\scolor\s*=/iu.test(attributes)
      ? withFill
      : withFill.replace(/>$/u, ' color="currentColor">');
  });
}

function addStrokeToUnstyledIconPaths(svg: string): string {
  return svg.replace(
    /<(path|line|polyline|polygon|circle|ellipse|rect)\b([^>]*)>/giu,
    (tag: string, tagName: string, attributes: string) => {
      if (/\sstroke\s*=/iu.test(attributes)) {
        return tag;
      }

      const strokeAttributes =
        ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
      const fillAttribute = /\s(fill|class)\s*=/iu.test(attributes)
        ? ""
        : ' fill="none"';

      return tag.replace(
        new RegExp(`<${tagName}\\b`, "iu"),
        `<${tagName}${fillAttribute}${strokeAttributes}`,
      );
    },
  );
}

function isAccentColor(color: string): boolean {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return false;
  }

  const red = rgb.red / 255;
  const green = rgb.green / 255;
  const blue = rgb.blue / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) {
    return false;
  }

  const lightness = (max + min) / 2;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));

  return (
    lightness >= MIN_ACCENT_LIGHTNESS &&
    lightness <= MAX_ACCENT_LIGHTNESS &&
    saturation >= MIN_ACCENT_SATURATION
  );
}

function isHttpUrl(value: string): boolean {
  const { protocol } = new URL(value);
  return protocol === "http:" || protocol === "https:";
}

function isBase64Payload(value: string): boolean {
  return value.length % 4 === 0 && BASE64_PATTERN.test(value);
}

function parseHexColor(
  color: string,
): { blue: number; green: number; red: number } | undefined {
  const normalized = color.replace(/^#/u, "");
  if (normalized.length === 3) {
    const [red, green, blue] = normalized.split("").map((part) => part + part);
    return parseRgbComponents(red, green, blue);
  }

  if (normalized.length === 6 || normalized.length === 8) {
    return parseRgbComponents(
      normalized.slice(0, 2),
      normalized.slice(2, 4),
      normalized.slice(4, 6),
    );
  }

  return undefined;
}

function parseRgbComponents(
  redHex: string | undefined,
  greenHex: string | undefined,
  blueHex: string | undefined,
): { blue: number; green: number; red: number } | undefined {
  if (!redHex || !greenHex || !blueHex) {
    return undefined;
  }

  const red = Number.parseInt(redHex, 16);
  const green = Number.parseInt(greenHex, 16);
  const blue = Number.parseInt(blueHex, 16);
  if (![red, green, blue].every(Number.isFinite)) {
    return undefined;
  }

  return { blue, green, red };
}

function svgTitle(filename: string): string {
  return filename
    .replace(/\.svg$/iu, "")
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function svgDescription(input: z.infer<typeof inputSchema>): string {
  return `Brand-aligned ${input.assetType} for ${input.filename}.`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function preview(value: string): string {
  if (value.length <= RESPONSE_PREVIEW_LENGTH) {
    return value;
  }

  return value.slice(0, RESPONSE_PREVIEW_LENGTH);
}
