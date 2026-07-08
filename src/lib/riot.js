const ROUTING = {
  ap: 'asia.api.riotgames.com',
  na: 'americas.api.riotgames.com',
  eu: 'europe.api.riotgames.com',
  kr: 'asia.api.riotgames.com',
}

async function riotFetch(fullPath) {
  const encoded = encodeURIComponent(fullPath)
  const res = await fetch(`/api/riot?path=${encoded}`)

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.status?.message || data?.error || `Riot API error ${res.status}`
    throw new Error(msg)
  }

  return data
}

export function parseRiotId(input) {
  const parts = input.trim().split('#')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid Riot ID format. Use Name#TAG')
  }
  return { gameName: parts[0], tagLine: parts[1] }
}

export async function getAccountByRiotId(gameName, tagLine, region = 'ap') {
  const host = ROUTING[region]
  return riotFetch(`${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
}

export async function getMatchList(puuid, region = 'ap', count = 20) {
  const host = ROUTING[region]
  return riotFetch(`${host}/val/match/v1/matchlists/by-puuid/${puuid}?queue=competitive&size=${count}`)
}

export async function getMatch(matchId, region = 'ap') {
  const host = ROUTING[region]
  return riotFetch(`${host}/val/match/v1/matches/${matchId}`)
}

export async function fetchPlayerData(riotId, region = 'ap', matchCount = 20) {
  const { gameName, tagLine } = parseRiotId(riotId)

  const account = await getAccountByRiotId(gameName, tagLine, region)
  const { puuid } = account

  const matchList = await getMatchList(puuid, region, matchCount)
  const matchIds = matchList.history?.map(m => m.matchId) || []

  if (matchIds.length === 0) {
    throw new Error('No competitive matches found. Make sure your profile is public and you have played competitive recently.')
  }

  const matches = await Promise.all(
    matchIds.slice(0, matchCount).map(id => getMatch(id, region))
  )

  return { account, matches, puuid }
}
