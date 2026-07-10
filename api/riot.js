// Only ever forward requests to Riot's own API hosts. Without this allowlist,
// `path` is attacker-controlled and this endpoint becomes an open SSRF relay
// that also attaches our X-Riot-Token to a request aimed at any domain the
// caller names — i.e. free key exfiltration to an attacker's own server.
const RIOT_HOST_PATTERN = /^([a-z0-9-]+\.)*api\.riotgames\.com$/i

const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://vantage-ochre-alpha.vercel.app'
  : '*'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { path } = req.query
  if (!path) return res.status(400).json({ error: 'Missing path' })

  let target
  try {
    target = new URL(`https://${path}`)
  } catch {
    return res.status(400).json({ error: 'Invalid path' })
  }

  if (!RIOT_HOST_PATTERN.test(target.hostname)) {
    return res.status(400).json({ error: 'Host not allowed' })
  }

  try {
    const response = await fetch(target.toString(), {
      headers: {
        'X-Riot-Token': process.env.VITE_RIOT_API_KEY,
        'Accept': 'application/json',
      }
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Riot API request failed' })
  }
}
