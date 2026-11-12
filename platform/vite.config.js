import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  resolve: {
    alias: [
      // the Obsidian UI originals use the "@/..." convention
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
      { find: /^next\/image$/, replacement: path.resolve(__dirname, 'src/shims/next-image.tsx') },
      { find: /^next-themes$/, replacement: path.resolve(__dirname, 'src/shims/next-themes.tsx') },
    ],
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
})
