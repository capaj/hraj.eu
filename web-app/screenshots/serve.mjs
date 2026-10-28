import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// This directory is also Vite's envDir and Wrangler's config directory.
// Refuse local overrides so screenshots never pick up a developer's credentials.
const overrides = (await readdir(import.meta.dirname)).filter(
  (name) => name.startsWith('.dev.vars') || name.startsWith('.env')
)
if (overrides.length) {
  throw new Error(
    'Remove .dev.vars/.env overrides from screenshots/ before capture.'
  )
}

process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'
process.env.CLOUDFLARE_INCLUDE_PROCESS_ENV = 'false'
process.env.CLOUDFLARE_VITE_FORCE_LOCAL = 'true'
process.env.WRANGLER_SEND_METRICS = 'false'
delete process.env.CLOUDFLARE_ENV

const { createServer } = await import('vite')
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  mode: 'screenshots',
  server: { host: '127.0.0.1', port: 5174, strictPort: true }
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await server.close()
    process.exit(0)
  })
}

await server.listen()
server.printUrls()
