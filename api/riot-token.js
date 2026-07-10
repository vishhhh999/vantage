// Exchanges an RSO authorization code for tokens, then resolves the
// player's own identity (puuid, gameName, tagLine) and their active
// Valorant shard/region — all server-side, since this is the only place
// the client_secret is allowed to exist.

const TOKEN_URL = 'https://auth.riotgames.com/token'
const REGION_ROUTING = {
  na1: 'na', la1: 'na', la2: 'na', br1: 'na', oc1: 'na',
  eu: 'eu', eun1: 'eu', euw1: 'eu', tr1: 'eu', ru: 'eu',
  ap: 'ap', kr: 'kr',
}

const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://vantage-ochre-alpha.vercel.app'
  : '*'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body || {}
  if (!code) return res.status(400).json({ error: 'Missing authorization code' })

  const clientId = process.env.RIOT_CLIENT_ID
  const clientSecret = process.env.RIOT_CLIENT_SECRET
  const redirectUri = process.env.RIOT_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({
      error: 'RSO is not configured on the server yet. Set RIOT_CLIENT_ID, RIOT_CLIENT_SECRET, and RIOT_REDIRECT_URI in Vercel — these come from Riot after they provision your RSO client via the developer portal Messages tab.'
    })
  }

  try {
    // 1. Exchange the authorization code for an access token (client_secret_basic).
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: tokenData.error_description || 'Token exchange failed', detail: tokenData })
    }
    const { access_token } = tokenData

    // 2. Resolve who logged in.
    const meRes = await fetch('https://americas.api.riotgames.com/riot/account/v1/accounts/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const me = await meRes.json()
    if (!meRes.ok) {
      return res.status(meRes.status).json({ error: 'Failed to resolve Riot account', detail: me })
    }

    // 3. Resolve their active Valorant shard so we know which region to query.
    let region = 'ap'
    try {
      const shardRes = await fetch(
        `https://americas.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/${me.puuid}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      if (shardRes.ok) {
        const shard = await shardRes.json()
        region = REGION_ROUTING[shard.activeShard] || 'ap'
      }
    } catch {
      // Non-fatal — default to 'ap' if shard lookup fails.
    }

    return res.status(200).json({
      puuid: me.puuid,
      gameName: me.gameName,
      tagLine: me.tagLine,
      region,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'RSO exchange failed' })
  }
}
