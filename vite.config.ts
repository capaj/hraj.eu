import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'
import macrosPlugin from 'vite-plugin-babel-macros'

export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    tanstackStart({
      target: 'cloudflare-module'
    }),
    macrosPlugin(),
    lingui(),
    tailwindcss()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['offline-geocode-city', 's2-geometry', 'long']
  },
  ssr: {
    noExternal: ['offline-geocode-city', 's2-geometry', 'long']
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
