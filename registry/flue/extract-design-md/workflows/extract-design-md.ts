import type { FlueContext } from '@flue/runtime'
import { composeDesignMd } from '../lib/compose.ts'

// Deterministic pipeline: given a domain, gather the context.dev signals and
// return three artifacts — the DESIGN.md (one Claude call) plus the
// Tailwind v4 @theme block and CSS :root tokens derived from the styleguide.
export async function run({ payload }: FlueContext<{ domain: string }>) {
  const { designMd, tailwind, css } = await composeDesignMd(payload.domain)
  return { designMd, tailwind, css }
}
