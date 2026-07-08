import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/riot': {
        target: 'https://ap.api.riotgames.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/riot/, ''),
        headers: {
          'X-Riot-Token': process.env.VITE_RIOT_API_KEY
        }
      }
    }
  }
})
