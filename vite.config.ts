import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from "vite-tsconfig-paths";
import { lingui } from '@lingui/vite-plugin';
import macrosPlugin from 'vite-plugin-babel-macros'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackStart({
      target: 'cloudflare-module',
    }),
    tailwindcss(),
    macrosPlugin(),
    lingui(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['offline-geocode-city', 's2-geometry', 'long'],
  },
  ssr: {
    noExternal: ['offline-geocode-city', 's2-geometry', 'long'],
  },
  resolve: {
    alias: process.env.NODE_ENV === 'development' ? {
      'offline-geocode-city': './node_modules/.pnpm/offline-geocode-city@1.0.2/node_modules/offline-geocode-city/dist/index.cjs.js'
    } : {}
  },
});