import { readFile } from 'node:fs/promises'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default createTool({
  id: 'read_file',
  description: 'Reads a UTF-8 file from the workspace.',
  inputSchema: z.object({
    path: z.string(),
  }),
  execute: async (inputData) => {
    const { path: filePath } = inputData
    const content = await readFile(resolveInWorkspace(filePath), 'utf-8')
    return { content, path: filePath }
  },
})
