import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Electron needs relative paths (file:// protocol); web needs absolute paths for SPA routing
  base: process.env.VITE_ELECTRON ? './' : '/',
  build: {
    outDir: 'dist',
  },
})
