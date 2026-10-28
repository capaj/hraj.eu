import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const [pathname, ...options] = process.argv.slice(2)
const baseURL = 'http://127.0.0.1:5174'
if (
  !pathname?.startsWith('/') ||
  new URL(pathname, baseURL).origin !== baseURL
) {
  throw new Error(
    'Usage: pnpm screenshot /scenarios/<name> [--project=desktop|mobile]'
  )
}

const child = spawn(
  process.execPath,
  [
    fileURLToPath(import.meta.resolve('@playwright/test/cli')),
    'test',
    '--config',
    'playwright.screenshots.config.ts',
    'page.spec.ts',
    ...options
  ],
  {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, SCREENSHOT_PATH: pathname },
    stdio: 'inherit'
  }
)
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
