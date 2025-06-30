import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackStart({
      target: 'cloudflare-module',
    }),
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['offline-geocode-city'],
  },
  resolve: {
    alias: {
      'offline-geocode-city': './node_modules/.pnpm/offline-geocode-city@1.0.2/node_modules/offline-geocode-city/dist/index.cjs.js'
    }
  },
});