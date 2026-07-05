import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default createTool({
  id: 'write_file',
  description: 'Writes (or overwrites) a UTF-8 file in the workspace.',
  inputSchema: z.object({
    path: z.string(),
    content: z.string(),
  }),
  execute: async (inputData) => {
    const { path: filePath, content } = inputData
    const target = resolveInWorkspace(filePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content, 'utf-8')
    return { bytes: content.length, path: filePath }
  },
})
