import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use @ as shorthand for src/ everywhere
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
})
