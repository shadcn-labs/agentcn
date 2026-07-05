import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { WORKSPACE } from '../lib/workspace'

const run = promisify(exec)

export default createTool({
  id: 'run_shell',
  description:
    'Runs a shell command inside the workspace directory and returns its stdout/stderr.',
  inputSchema: z.object({
    command: z.string(),
  }),
  execute: async (inputData) => {
    const { command } = inputData
    try {
      const { stdout, stderr } = await run(command, {
        cwd: WORKSPACE,
        timeout: 60_000,
      })
      return { stderr, stdout }
    } catch (error) {
      return { error: String(error) }
    }
  },
})
