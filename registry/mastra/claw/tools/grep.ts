import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      files.push(...(await walk(fullPath)))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

export default createTool({
  id: 'grep',
  description: 'Searches for a regex pattern across files in the workspace.',
  inputSchema: z.object({
    pattern: z.string().describe('Regular expression pattern to search for'),
    dirPath: z
      .string()
      .optional()
      .describe('Relative directory to search in (defaults to workspace root)'),
  }),
  outputSchema: z.object({
    matches: z.array(
      z.object({
        file: z.string(),
        line: z.number(),
        content: z.string(),
      }),
    ),
  }),
  execute: async (inputData) => {
    const { pattern, dirPath = '.' } = inputData
    const root = resolveInWorkspace(dirPath)
    const re = new RegExp(pattern, 'gi')
    const files = await walk(root)
    const matches: Array<{ file: string; line: number; content: string }> = []
    for (const filePath of files) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            matches.push({
              file: relative(process.cwd(), filePath),
              line: i + 1,
              content: lines[i],
            })
          }
          re.lastIndex = 0
        }
      } catch {
        // skip unreadable files
      }
    }
    return { matches }
  },
})
