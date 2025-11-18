import { lingui } from '@lingui/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  server: {
    port: 5173
  },
  build: {
    target: 'esnext'
  },
  plugins: [
    lingui(),
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({}),
    react({
      babel: {
        plugins: ['@lingui/babel-plugin-lingui-macro']
      }
    })
  ]
})
