import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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