import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'node:path'

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: ['**/src/routeTree.gen.ts', '**/.tanstack/**']
    }
  },
  optimizeDeps: {
    exclude: ['@lingui/macro', '@lingui/core/macro', '@lingui/react/macro']
  },
  environments: {
    ssr: {
      optimizeDeps: {
        include: ['@libsql/client'],
        exclude: ['@lingui/macro', '@lingui/core/macro', '@lingui/react/macro']
      }
    }
  },
  plugins: [
    {
      name: 'hraj:route-tree-hmr-workaround',
      apply: 'serve',
      configureServer(server) {
        const routesDir = path.resolve(server.config.root, 'src/routes') + path.sep
        const shouldReloadForRouteChange = (file: string) =>
          file.startsWith(routesDir) &&
          (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))

        const reload = () => server.ws.send({ type: 'full-reload' })

        server.watcher.on('add', (file) => {
          if (shouldReloadForRouteChange(file)) {
            setTimeout(reload, 25)
          }
        })
        server.watcher.on('unlink', (file) => {
          if (shouldReloadForRouteChange(file)) {
            setTimeout(reload, 25)
          }
        })
      }
    },
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),

    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['macros']
      }
    }),
    lingui(),
    tailwindcss()
  ]
})
