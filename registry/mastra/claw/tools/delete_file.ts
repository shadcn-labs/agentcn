import { unlink } from 'node:fs/promises'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default createTool({
  id: 'delete_file',
  description: 'Deletes a file from the workspace.',
  inputSchema: z.object({
    path: z.string().describe('Relative path to the file to delete'),
  }),
  execute: async (inputData) => {
    const { path: filePath } = inputData
    const target = resolveInWorkspace(filePath)
    await unlink(target)
    return { success: true, path: filePath }
  },
})
