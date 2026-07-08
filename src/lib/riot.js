const RIOT_API_KEY = import.meta.env.VITE_RIOT_API_KEY

const REGIONS = {
  ap: 'https://ap.api.riotgames.com',
  na: 'https://na.api.riotgames.com',
  eu: 'https://eu.api.riotgames.com',
  kr: 'https://kr.api.riotgames.com',
}

const ROUTING = {
  ap: 'https://asia.api.riotgames.com',
  na: 'https://americas.api.riotgames.com',
  eu: 'https://europe.api.riotgames.com',
  kr: 'https://asia.api.riotgames.com',
}

async function riotFetch(url) {
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.status?.message || `Riot API error: ${res.status}`)
  }
  return res.json()
}

export async function getAccountByRiotId(gameName, tagLine, region = 'ap') {
  const routing = ROUTING[region]
  const url = `${routing}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  return riotFetch(url)
}

export async function getMatchList(puuid, region = 'ap', count = 20) {
  const routing = ROUTING[region]
  const url = `${routing}/val/match/v1/matchlists/by-puuid/${puuid}?queue=competitive&size=${count}`
  return riotFetch(url)
}

export async function getMatch(matchId, region = 'ap') {
  const routing = ROUTING[region]
  const url = `${routing}/val/match/v1/matches/${matchId}`
  return riotFetch(url)
}

export async function getPlayerRank(puuid, region = 'ap') {
  const base = REGIONS[region]
  const url = `${base}/val/ranked/v1/leaderboards/by-puuid/${puuid}`
  return riotFetch(url)
}

export function parseRiotId(input) {
  const parts = input.trim().split('#')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid Riot ID format. Use Name#TAG')
  }
  return { gameName: parts[0], tagLine: parts[1] }
}

export async function fetchPlayerData(riotId, region = 'ap', matchCount = 20) {
  const { gameName, tagLine } = parseRiotId(riotId)

  const account = await getAccountByRiotId(gameName, tagLine, region)
  const { puuid } = account

  const matchList = await getMatchList(puuid, region, matchCount)
  const matchIds = matchList.history?.map(m => m.matchId) || []

  const matches = await Promise.all(
    matchIds.slice(0, matchCount).map(id => getMatch(id, region))
  )

  return { account, matches, puuid }
}
