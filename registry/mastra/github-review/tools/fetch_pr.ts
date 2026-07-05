import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const GITHUB_API = 'https://api.github.com'

const headers = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
  'X-GitHub-Api-Version': '2022-11-28',
})

const prIdentifierSchema = z.object({
  owner: z.string().describe('Repository owner (user or organization)'),
  repo: z.string().describe('Repository name'),
  pullNumber: z.number().describe('Pull request number'),
})

const prSchema = z.object({
  title: z.string(),
  body: z.string().nullable(),
  state: z.string(),
  author: z.string(),
  baseBranch: z.string(),
  headBranch: z.string(),
  headSha: z.string().describe('Head commit SHA — persists even after the branch is deleted'),
  labels: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  additions: z.number(),
  deletions: z.number(),
  changedFiles: z.number(),
})

const fileSchema = z.object({
  filename: z.string(),
  status: z.string(),
  additions: z.number(),
  deletions: z.number(),
  changes: z.number(),
  patch: z.string().optional(),
})

function mapPRResponse(data: any) {
  return {
    title: data.title as string,
    body: (data.body as string) ?? null,
    state: data.state as string,
    author: (data.user?.login as string) ?? 'ghost',
    baseBranch: data.base.ref as string,
    headBranch: data.head.ref as string,
    headSha: data.head.sha as string,
    labels: ((data.labels ?? []) as Array<{ name: string }>).map(l => l.name),
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    additions: data.additions as number,
    deletions: data.deletions as number,
    changedFiles: data.changed_files as number,
  }
}

function mapFilesResponse(data: any[]) {
  return data.map(f => ({
    filename: f.filename as string,
    status: f.status as string,
    additions: f.additions as number,
    deletions: f.deletions as number,
    changes: f.changes as number,
    ...(f.patch !== undefined ? { patch: f.patch as string } : {}),
  }))
}

export default createTool({
  id: 'fetch_pr',
  description:
    'Fetches a GitHub pull request — its metadata and the list of changed files with patches.',
  inputSchema: prIdentifierSchema,
  outputSchema: z.object({
    pr: prSchema,
    files: z.array(fileSchema),
  }),
  execute: async (inputData) => {
    const { owner, repo, pullNumber } = inputData
    const base = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}`
    const [prResponse, filesResponse] = await Promise.all([
      fetch(base, { headers: headers() }).then((r) => r.json()),
      fetch(`${base}/files?per_page=100`, { headers: headers() }).then((r) => r.json()),
    ])
    return {
      pr: mapPRResponse(prResponse),
      files: mapFilesResponse(filesResponse),
    }
  },
})