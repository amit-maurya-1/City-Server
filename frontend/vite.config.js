import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'], 
  },
  server: {
    port: 3000,
  },
})
