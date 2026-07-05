import { readFile, writeFile } from 'node:fs/promises'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default createTool({
  id: 'edit_file',
  description:
    'Replaces an exact string match in an existing file. Fails if oldContent is not found.',
  inputSchema: z.object({
    path: z.string().describe('Relative path to the file'),
    oldContent: z.string().describe('Exact string to find'),
    newContent: z.string().describe('String to replace it with'),
  }),
  execute: async (inputData) => {
    const { path: filePath, oldContent, newContent } = inputData
    const target = resolveInWorkspace(filePath)
    const content = await readFile(target, 'utf-8')
    if (!content.includes(oldContent)) {
      throw new Error(`oldContent not found in ${filePath}`)
    }
    await writeFile(target, content.replace(oldContent, newContent), 'utf-8')
    return { success: true, path: filePath }
  },
})
