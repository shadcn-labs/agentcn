import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

const inputSchema = v.object({
  query: v.pipe(v.string(), v.minLength(1)),
  domain: v.optional(v.string()),
})

export const contextDevSearch = defineTool({
  name: 'context_dev_search',
  description:
    'Search Context.dev for brand data, styleguides, and webpage content. Use this to gather brand colors, typography, logos, and product context from a domain before generating SVG assets.',
  parameters: inputSchema,
  execute: async ({ query, domain }) => {
    const apiKey =
      process.env.CONTEXT_DEV_API_KEY?.trim() || process.env.CONTEXT_API_KEY?.trim()

    if (!apiKey) {
      return JSON.stringify({
        ok: false,
        error:
          'Missing CONTEXT_DEV_API_KEY or CONTEXT_API_KEY for Context.dev access. Set the environment variable and restart.',
      })
    }

    const url = new URL('https://context-dev.stlmcp.com')
    const body: Record<string, unknown> = {
      method: 'tools/call',
      params: {
        name: 'search_docs',
        arguments: { query },
      },
    }

    if (domain) {
      ;(body.params as Record<string, unknown>).arguments = {
        ...(body.params as Record<string, unknown>).arguments as Record<string, unknown>,
        domain,
      }
    }

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-context-dev-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return JSON.stringify({
        ok: false,
        error: `Context.dev API ${res.status}: ${res.statusText}`,
      })
    }

    const data = await res.json()
    return JSON.stringify({ ok: true, data })
  },
})
