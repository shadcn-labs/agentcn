import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { ContextDev } from 'context.dev'
import { buildDesignMdPrompt, DESIGN_MD_SYSTEM } from './design-md'
import {
  deriveCssVariables,
  deriveTailwindTheme,
  type LiveBrand,
  type LiveStyleguide,
} from './derive-tokens'

const client = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY ?? '' })

interface DesignSignals {
  styleguide: unknown
  brand: unknown
  screenshotUrl: string | null
  markdown: string
}

async function fetchSignals(domain: string): Promise<DesignSignals> {
  const [styleguide, brand, screenshot, markdown] = await Promise.all([
    client.web.extractStyleguide({ domain, timeoutMS: 120_000 }),
    client.brand.retrieve({ domain }),
    client.web.screenshot({
      domain,
      fullScreenshot: 'false',
      handleCookiePopup: 'true',
    }),
    client.web.webScrapeMd({
      url: `https://${domain}`,
      includeLinks: true,
      includeImages: false,
      useMainContentOnly: true,
    }),
  ])

  return {
    styleguide: styleguide.styleguide ?? null,
    brand: brand.brand ?? null,
    screenshotUrl: screenshot.screenshot ?? null,
    markdown: markdown.markdown ?? '',
  }
}

async function generateDesignMd(
  domain: string,
  signals: DesignSignals
): Promise<string> {
  const prompt = buildDesignMdPrompt({
    domain,
    contextStyleguide: signals.styleguide,
    screenshotUrl: signals.screenshotUrl ?? undefined,
    markdown: signals.markdown,
  })

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    system: DESIGN_MD_SYSTEM,
    messages: [
      {
        role: 'user',
        content: signals.screenshotUrl
          ? [
              { type: 'image', image: new URL(signals.screenshotUrl) },
              { type: 'text', text: prompt },
            ]
          : [{ type: 'text', text: prompt }],
      },
    ],
    temperature: 0.2,
  })

  return text.trim()
}

export interface DesignMdResult {
  designMd: string
  tailwind: string
  css: string
}

export async function composeDesignMd(domain: string): Promise<DesignMdResult> {
  const signals = await fetchSignals(domain)
  const designMd = await generateDesignMd(domain, signals)
  const styleguide = signals.styleguide as LiveStyleguide | null
  const brand = (signals.brand as LiveBrand | null) ?? undefined

  return {
    designMd,
    tailwind: deriveTailwindTheme(domain, brand, styleguide),
    css: deriveCssVariables(domain, brand, styleguide),
  }
}
