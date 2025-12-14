import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  server: {
    port: 5173
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
