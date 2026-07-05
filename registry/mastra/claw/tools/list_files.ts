import { readdir, stat } from 'node:fs/promises'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default createTool({
  id: 'list_files',
  description: 'Lists files and subdirectories in a workspace directory.',
  inputSchema: z.object({
    dirPath: z
      .string()
      .optional()
      .describe('Relative directory path (defaults to workspace root)'),
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['file', 'directory']),
        size: z.number(),
      }),
    ),
  }),
  execute: async (inputData) => {
    const { dirPath = '.' } = inputData
    const target = resolveInWorkspace(dirPath)
    const entries = await readdir(target, { withFileTypes: true })
    const result = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = `${target}/${entry.name}`
        const s = await stat(fullPath)
        return {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' as const : 'file' as const,
          size: s.size,
        }
      }),
    )
    return { files: result }
  },
})
