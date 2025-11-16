import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'
import macrosPlugin from 'vite-plugin-babel-macros'
import viteReact from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  server: {
    port: 5173
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),

    tanstackStart(),
    viteReact(),
    macrosPlugin(),
    lingui(),
    tailwindcss()
  ]
})
