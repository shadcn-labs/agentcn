import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const GITHUB_API = 'https://api.github.com'

const headers = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
  'X-GitHub-Api-Version': '2022-11-28',
})

export default createTool({
  id: 'get_pr_files',
  description: 'Gets the list of files changed in a GitHub pull request.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (user or organization)'),
    repo: z.string().describe('Repository name'),
    prNumber: z.number().describe('Pull request number'),
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        filename: z.string(),
        status: z.string(),
        additions: z.number(),
        deletions: z.number(),
      }),
    ),
  }),
  execute: async (inputData) => {
    const { owner, repo, prNumber } = inputData
    const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`
    const data = await fetch(url, { headers: headers() }).then((r) => r.json())
    return {
      files: (data as any[]).map((f) => ({
        filename: f.filename as string,
        status: f.status as string,
        additions: f.additions as number,
        deletions: f.deletions as number,
      })),
    }
  },
})
