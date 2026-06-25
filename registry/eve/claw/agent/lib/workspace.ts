import path from 'node:path'

export const WORKSPACE = path.resolve(process.env.WORKSPACE_DIR ?? 'workspace')

export function resolveInWorkspace(relativePath: string): string {
  const resolved = path.resolve(WORKSPACE, relativePath)
  if (resolved !== WORKSPACE && !resolved.startsWith(WORKSPACE + path.sep)) {
    throw new Error(`Path escapes the workspace: ${relativePath}`)
  }
  return resolved
}
