import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

// Normalize common mistakes: missing protocol, trailing slash
supabaseUrl = supabaseUrl.trim()
if (!/^https?:\/\//i.test(supabaseUrl)) {
  supabaseUrl = `https://${supabaseUrl}`
}
supabaseUrl = supabaseUrl.replace(/\/+$/, '')

// Supabase project URLs look like https://xxxxx.supabase.co — nothing after the domain.
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  console.warn(
    `[Supabase] VITE_SUPABASE_URL looks malformed: "${supabaseUrl}". ` +
    `It should look exactly like https://your-project-ref.supabase.co with nothing extra ` +
    `before or after it (no /auth/v1, no trailing slash, no quotes). ` +
    `Check Vercel → Settings → Environment Variables.`
  )
}

export const supabase = globalThis.__vantageSupabase || createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vantage-auth',
  },
})

// Vite HMR in dev can re-run this module and create a second GoTrue client,
// which causes intermittent/flickery session state (e.g. sign-out not sticking,
// or the app appearing to "refresh" back into a signed-in state). Pin one
// instance on the global object so hot reloads reuse it instead of duplicating it.
if (import.meta.env.DEV) {
  globalThis.__vantageSupabase = supabase
}
