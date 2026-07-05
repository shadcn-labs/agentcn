import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const GITHUB_API = 'https://api.github.com'

const headers = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
  'X-GitHub-Api-Version': '2022-11-28',
})

export default createTool({
  id: 'get_file_content',
  description:
    'Gets the raw content of a specific file from a GitHub repository.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (user or organization)'),
    repo: z.string().describe('Repository name'),
    filePath: z.string().describe('Path to the file in the repository'),
    ref: z
      .string()
      .optional()
      .describe('Branch, tag, or commit SHA (defaults to the default branch)'),
  }),
  outputSchema: z.object({
    content: z.string(),
    encoding: z.string(),
  }),
  execute: async (inputData) => {
    const { owner, repo, filePath, ref } = inputData
    const url = new URL(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`,
    )
    if (ref) url.searchParams.set('ref', ref)
    const data = await fetch(url.toString(), { headers: headers() }).then(
      (r) => r.json(),
    )
    if (data.encoding === 'base64') {
      return {
        content: Buffer.from(data.content as string, 'base64').toString('utf-8'),
        encoding: 'utf-8',
      }
    }
    return {
      content: (data.content as string) ?? '',
      encoding: (data.encoding as string) ?? 'none',
    }
  },
})
