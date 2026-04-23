import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
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
  environments: {
    ssr: {
      optimizeDeps: {
        include: ['@libsql/client'],
        noDiscovery: true
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
    viteReact(),
    lingui(),
    babel({ presets: [linguiTransformerBabelPreset()] }),
    tailwindcss()
  ]
})
