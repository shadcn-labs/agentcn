import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export default createTool({
  id: 'parse_github_url',
  description:
    'Parses a GitHub pull request URL and extracts the owner, repository name, and PR number.',
  inputSchema: z.object({
    url: z.string().url().describe('GitHub pull request URL'),
  }),
  outputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    prNumber: z.number(),
  }),
  execute: async (inputData) => {
    const { url } = inputData
    const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
    if (!match) {
      throw new Error(`Invalid GitHub PR URL: ${url}`)
    }
    return {
      owner: match[1],
      repo: match[2],
      prNumber: parseInt(match[3], 10),
    }
  },
})
