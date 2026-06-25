import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import { ContextDev } from 'context.dev'

// All four design signals are pulled through context.dev. Run them in parallel
// from the agent; each is independent. https://context.dev
const client = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY ?? '' })

export const extractStyleguide = defineTool({
  name: 'extract_styleguide',
  description:
    'Extracts the design tokens for a domain — colors, typography, spacing, radii, and components.',
  parameters: v.object({ domain: v.string() }),
  execute: async ({ domain }) =>
    JSON.stringify(await client.web.extractStyleguide({ domain, timeoutMS: 120_000 })),
})

export const getBrand = defineTool({
  name: 'get_brand',
  description:
    'Retrieves brand assets for a domain — logos, backdrops, brand colors, slogan, and industry.',
  parameters: v.object({ domain: v.string() }),
  execute: async ({ domain }) => JSON.stringify(await client.brand.retrieve({ domain })),
})

export const captureScreenshot = defineTool({
  name: 'capture_screenshot',
  description: 'Captures a homepage screenshot for visual context and returns its URL.',
  parameters: v.object({ domain: v.string() }),
  execute: async ({ domain }) =>
    JSON.stringify(
      await client.web.screenshot({
        domain,
        fullScreenshot: 'false',
        handleCookiePopup: 'true',
      })
    ),
})

export const fetchMarkdown = defineTool({
  name: 'fetch_markdown',
  description: "Converts the domain's homepage to clean Markdown for grounding the document.",
  parameters: v.object({ domain: v.string() }),
  execute: async ({ domain }) =>
    JSON.stringify(
      await client.web.webScrapeMd({
        url: `https://${domain}`,
        includeLinks: false,
        includeImages: false,
        useMainContentOnly: true,
      })
    ),
})
