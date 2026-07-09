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

// VAL-CONTENT-V1 gives the authoritative characterId -> name and mapId -> name
// mapping directly from Riot. This is deliberately not hardcoded: agent/map
// UUIDs are stable but numerous, and a hand-maintained table would silently
// go stale the moment Riot ships a new agent. Content rarely changes within
// a session, so callers should fetch this once and reuse it.
export async function getContent(region = 'ap') {
  const host = ROUTING[region]
  return riotFetch(`${host}/val/content/v1/contents`)
}

export function buildContentResolver(content) {
  const characterMap = new Map()
  const mapMap = new Map()

  ;(content?.characters || []).forEach(c => {
    if (c.id) characterMap.set(c.id.toLowerCase(), c.name)
  })
  ;(content?.maps || []).forEach(m => {
    if (m.id) mapMap.set(m.id.toLowerCase(), m.name)
    // mapUrl / assetPath sometimes differs in casing/format from the id used
    // in match data, so also index by the trailing path segment as a fallback.
    if (m.assetPath) {
      const seg = m.assetPath.split('/').filter(Boolean).pop()
      if (seg) mapMap.set(seg.toLowerCase(), m.name)
    }
  })

  return {
    characterName(characterId) {
      if (!characterId) return 'Unknown'
      return characterMap.get(characterId.toLowerCase()) || characterId
    },
    mapName(mapId) {
      if (!mapId) return 'Unknown'
      const direct = mapMap.get(mapId.toLowerCase())
      if (direct) return direct
      const seg = mapId.split('/').filter(Boolean).pop()
      return (seg && mapMap.get(seg.toLowerCase())) || mapId
    },
  }
}

export async function fetchPlayerData(riotId, region = 'ap', matchCount = 20) {
  const { gameName, tagLine } = parseRiotId(riotId)

  const account = await getAccountByRiotId(gameName, tagLine, region)
  const { puuid } = account

  const [matchList, content] = await Promise.all([
    getMatchList(puuid, region, matchCount),
    getContent(region),
  ])

  const matchIds = matchList.history?.map(m => m.matchId) || []

  if (matchIds.length === 0) {
    throw new Error('No competitive matches found. Make sure your profile is public and you have played competitive recently.')
  }

  const matches = await Promise.all(
    matchIds.slice(0, matchCount).map(id => getMatch(id, region))
  )

  return { account, matches, puuid, resolver: buildContentResolver(content) }
}
