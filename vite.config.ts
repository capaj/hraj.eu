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
    include: ['offline-geocode-city', 's2-geometry', 'long'],
  },
  ssr: {
    noExternal: ['offline-geocode-city', 's2-geometry', 'long'],
  },
});