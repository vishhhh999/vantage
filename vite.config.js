import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Note: /api/* routes are Vercel serverless functions (see /api/riot.js and
// /api/anthropic.js), not handled by Vite's dev server. Running `npm run dev`
// will not have working API routes — use `vercel dev` for local testing that
// includes them, or just test against the deployed Vercel URL.
export default defineConfig({
  plugins: [react()],
})
