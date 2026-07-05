import { agentConfig } from '@mastra/core/agent'
import { AgentBrowser, AgentBrowserThreadManager } from '@mastra/agent-browser'
import type { AgentBrowserThreadManagerConfig } from '@mastra/agent-browser'
import { openai } from '@ai-sdk/openai'
import { createRequire } from 'node:module'
import { dirname, join, normalize } from 'node:path'
import { spawn } from 'node:child_process'
import 'playwright-chromium'

const require = createRequire(import.meta.url)

let installDepsPromise: Promise<void> | undefined

function shouldInstallLinuxDeps() {
  return (
    process.platform === 'linux' &&
    typeof process.getuid === 'function' &&
    process.getuid() === 0 &&
    process.env.BROWSER_SKIP_INSTALL_DEPS !== 'true' &&
    !process.env.BROWSER_CDP_URL
  )
}

function resolvePlaywrightCli() {
  const packageEntry = require.resolve('playwright-chromium')
  const cliPath = normalize(join(dirname(packageEntry), 'cli.js'))

  if (!cliPath.endsWith('/node_modules/playwright-chromium/cli.js')) {
    throw new Error(`Unexpected playwright-chromium CLI path: ${cliPath}`)
  }

  return cliPath
}

async function installPlaywrightLinuxDeps() {
  if (!shouldInstallLinuxDeps()) return

  installDepsPromise ??= new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [resolvePlaywrightCli(), 'install-deps', 'chromium'], {
      shell: false,
      stdio: 'inherit',
    })

    const timeout = setTimeout(() => {
      installDepsPromise = undefined
      child.kill('SIGTERM')
      reject(new Error('Timed out installing Playwright Chromium system dependencies'))
    }, 120_000)

    child.once('error', error => {
      clearTimeout(timeout)
      installDepsPromise = undefined
      reject(error)
    })

    child.once('exit', code => {
      clearTimeout(timeout)
      if (code === 0) {
        resolve()
      } else {
        installDepsPromise = undefined
        reject(new Error(`Failed to install Playwright Chromium system dependencies: exit code ${code}`))
      }
    })
  })

  await installDepsPromise
}

class RuntimeDepsThreadManager extends AgentBrowserThreadManager {
  protected override async createSession(threadId: string) {
    await installPlaywrightLinuxDeps()
    return super.createSession(threadId)
  }
}

const browser = new AgentBrowser({
  headless: process.env.BROWSER_HEADLESS !== 'false',
  ...(process.env.BROWSER_CDP_URL ? { cdpUrl: process.env.BROWSER_CDP_URL, scope: 'shared' as const } : {}),
  createThreadManager: (config: AgentBrowserThreadManagerConfig) => new RuntimeDepsThreadManager(config),
})

export default agentConfig({
  model: 'mastra/openai/gpt-5-mini',
  browser,
  defaultOptions: {
    maxSteps: 100,
  },
  tools: {
    web_search: openai.tools.webSearch({}),
  },
})
