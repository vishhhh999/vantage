const CLIENT_ID = import.meta.env.VITE_RIOT_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_RIOT_REDIRECT_URI

export function isRsoConfigured() {
  return Boolean(CLIENT_ID && REDIRECT_URI)
}

// Sends the player to Riot's own login page. They authenticate directly
// with Riot (we never see their password) and consent to sharing their
// match data with VANTAGE. `state` round-trips through Riot so we can
// tell which app-user initiated this once they land back on our callback.
export function buildRiotAuthorizeUrl(state) {
  if (!isRsoConfigured()) {
    throw new Error('Riot sign-in is not configured yet. VITE_RIOT_CLIENT_ID and VITE_RIOT_REDIRECT_URI must be set.')
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid',
    state,
  })
  return `https://auth.riotgames.com/authorize?${params.toString()}`
}

// Exchanges the code Riot handed back on our redirect for the player's
// verified puuid / Riot ID / region. The actual token exchange (which
// needs the client secret) happens server-side in /api/riot-token.
export async function exchangeRiotCode(code) {
  const res = await fetch('/api/riot-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to complete Riot sign-in')
  return data // { puuid, gameName, tagLine, region }
}
