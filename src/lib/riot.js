const ROUTING = {
  ap: 'asia.api.riotgames.com',
  na: 'americas.api.riotgames.com',
  eu: 'europe.api.riotgames.com',
  kr: 'asia.api.riotgames.com',
}

const REGIONS = {
  ap: 'ap.api.riotgames.com',
  na: 'na.api.riotgames.com',
  eu: 'eu.api.riotgames.com',
  kr: 'kr.api.riotgames.com',
}

async function riotFetch(host, path) {
  const url = `/api/riot?path=${encodeURIComponent(host + path)}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.status?.message || `Riot API error: ${res.status}`)
  }
  return res.json()
}

export async function getAccountByRiotId(gameName, tagLine, region = 'ap') {
  const host = ROUTING[region]
  const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  return riotFetch(host, path)
}

export async function getMatchList(puuid, region = 'ap', count = 20) {
  const host = ROUTING[region]
  const path = `/val/match/v1/matchlists/by-puuid/${puuid}?queue=competitive&size=${count}`
  return riotFetch(host, path)
}

export async function getMatch(matchId, region = 'ap') {
  const host = ROUTING[region]
  const path = `/val/match/v1/matches/${matchId}`
  return riotFetch(host, path)
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

  if (matchIds.length === 0) {
    throw new Error('No competitive matches found. Make sure your profile is public.')
  }

  const matches = await Promise.all(
    matchIds.slice(0, matchCount).map(id => getMatch(id, region))
  )

  return { account, matches, puuid }
}
