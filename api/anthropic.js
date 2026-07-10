import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://vantage-ochre-alpha.vercel.app'
  : '*'

// This proxy exists so the Anthropic key never reaches the browser — but a
// proxy with no auth check just moves the problem: anyone who finds the URL
// can call it directly (curl, Postman) and spend our API budget on our key,
// completely bypassing the app's own 5-minute cooldown, which was only ever
// enforced client-side. Every call now has to carry a real signed-in
// Supabase session token, verified server-side, before it's forwarded.
async function getVerifiedUserId(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.id
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await getVerifiedUserId(req)
  if (!userId) {
    return res.status(401).json({ error: 'Sign in required' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Anthropic proxy failed' })
  }
}
