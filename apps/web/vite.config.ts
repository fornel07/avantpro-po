import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Also read monorepo root .env for shared vars (without leaking secrets into client).
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '../..'), '')
  const apiTarget = rootEnv.VITE_API_PROXY_TARGET || 'http://localhost:3001'

  // GitHub Pages project site needs a subpath (e.g. /avantpro-po/).
  // Local dev stays at /. Set via VITE_BASE in CI.
  const base = process.env.VITE_BASE || '/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    envDir: path.resolve(__dirname),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
