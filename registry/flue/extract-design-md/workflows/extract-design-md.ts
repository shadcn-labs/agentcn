import type { FlueContext } from '@flue/runtime'
import { composeDesignMd } from '../lib/compose.ts'

export async function run({ payload }: FlueContext<{ domain: string }>) {
  const { designMd, tailwind, css } = await composeDesignMd(payload.domain)
  return { designMd, tailwind, css }
}
