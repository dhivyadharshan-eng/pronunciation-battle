import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Set VITE_BASE_PATH=/pronunciation-battle/ in GitHub Actions for project pages.
  base: process.env.VITE_BASE_PATH || '/',
})
