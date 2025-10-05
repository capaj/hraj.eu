import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'
import macrosPlugin from 'vite-plugin-babel-macros'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5173
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    tanstackStart({
      target: 'cloudflare-module',
      customViteReactPlugin: true
    }),
    viteReact(),
    macrosPlugin(),
    lingui(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: ['offline-geocode-city', 'long'],
    exclude: ['wrangler', 's2-geometry']
  },
  ssr: {
    noExternal: ['offline-geocode-city', 'long'],
    external: ['wrangler', 's2-geometry']
  },
  resolve: {
    alias:
      process.env.NODE_ENV === 'development'
        ? {
            'offline-geocode-city':
              './node_modules/.pnpm/offline-geocode-city@1.0.2/node_modules/offline-geocode-city/dist/index.cjs.js'
          }
        : {}
  }
})
