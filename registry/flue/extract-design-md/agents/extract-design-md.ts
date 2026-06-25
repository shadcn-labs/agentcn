import { createAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import designMd from '../skills/design-md/SKILL.md' with { type: 'skill' }
import {
  captureScreenshot,
  extractStyleguide,
  fetchMarkdown,
  getBrand,
} from '../tools/context.ts'

export const route: AgentRouteHandler = async (_c, next) => next()

export default createAgent(() => ({
  model: 'anthropic/claude-sonnet-4-6',
  instructions: `
    You turn a website into a self-contained DESIGN.md design-system document.
    Given a domain, gather the four signals through context.dev —
    extract_styleguide, get_brand, capture_screenshot, and fetch_markdown — then
    follow the design-md skill to compose the document: YAML frontmatter of
    tokens followed by the canonical sections. Use precise values from the
    styleguide; ground the Overview in the brand and page Markdown. Output only
    the DESIGN.md.
  `,
  skills: [designMd],
  tools: [extractStyleguide, getBrand, captureScreenshot, fetchMarkdown],
}))
