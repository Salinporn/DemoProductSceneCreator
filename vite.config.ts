import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/digitalhome/productdemo/',
  server: {
    port: 5174,
    fs: {
      strict: false,
    },
  },
  build: {
    rollupOptions: {
      input: './index.html',
    },
  },
  resolve: {
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['three'],
  },
});