// Rank tier IDs are stable across Riot's official API and have not changed
// since the Ascendant/Immortal 1-3 split was introduced — this table is safe
// to hardcode, unlike agent/map UUIDs which come from VAL-CONTENT-V1 instead.
const TIER_NAMES = [
  'Unranked', null, null,
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant',
]

export function getRankName(tier) {
  return TIER_NAMES[tier] || 'Unranked'
}

export function scoreMatches(matches, puuid, resolver) {
  const stats = matches.map(match => extractPlayerStats(match, puuid, resolver)).filter(Boolean)

  if (stats.length === 0) return null

  return {
    overview: computeOverview(stats),
    scores: computeScores(stats),
    rawStats: stats,
  }
}

function extractPlayerStats(match, puuid, resolver) {
  const player = match?.players?.find(p => p.puuid === puuid)
  if (!player) return null

  const teamId = player.teamId
  const teams = match.teams || []
  const myTeam = teams.find(t => t.teamId === teamId)
  const oppTeam = teams.find(t => t.teamId !== teamId)

  const rounds = match.roundResults || []
  let ownRounds = myTeam?.roundsWon
  let oppRounds = oppTeam?.roundsWon
  let won = myTeam?.won

  // Defensive fallback if the teams array is missing/malformed on some match types.
  if (ownRounds == null || oppRounds == null) {
    ownRounds = rounds.filter(r => r.winningTeam === teamId).length
    oppRounds = rounds.length - ownRounds
    won = ownRounds > oppRounds
  }

  // Damage/headshot data lives per-round, per-player, and has to be aggregated
  // across the match. `playerStats[].damage[]` entries are damage THIS player
  // dealt to others; to get damage RECEIVED we scan every round's playerStats
  // for entries where someone else's damage[] targeted our puuid.
  let damageDealt = 0, damageTaken = 0, headshots = 0, bodyshots = 0, legshots = 0

  rounds.forEach(round => {
    const roundPlayers = round.playerStats || []
    const mine = roundPlayers.find(ps => ps.puuid === puuid)
    if (mine?.damage) {
      mine.damage.forEach(d => {
        damageDealt += d.damage || 0
        headshots += d.headshots || 0
        bodyshots += d.bodyshots || 0
        legshots += d.legshots || 0
      })
    }
    roundPlayers.forEach(ps => {
      if (ps.puuid === puuid) return
      ;(ps.damage || []).forEach(d => {
        if (d.receiver === puuid) damageTaken += d.damage || 0
      })
    })
  })

  const casts = player.stats?.abilityCasts || {}

  return {
    matchId: match.matchInfo?.matchId,
    gameStartMillis: match.matchInfo?.gameStartMillis || 0,
    map: resolver ? resolver.mapName(match.matchInfo?.mapId) : match.matchInfo?.mapId,
    agent: resolver ? resolver.characterName(player.characterId) : player.characterId,
    team: teamId,
    won: Boolean(won),
    score: { own: ownRounds, opp: oppRounds },
    rankTier: player.competitiveTier ?? 0,
    stats: {
      kills: player.stats?.kills ?? 0,
      deaths: player.stats?.deaths || 1,
      assists: player.stats?.assists ?? 0,
      score: player.stats?.score ?? 0,
      headshots,
      bodyshots,
      legshots,
      damage: damageDealt,
      damageTaken,
    },
    abilities: {
      grenade: casts.grenadeCasts || 0,
      ability1: casts.ability1Casts || 0,
      ability2: casts.ability2Casts || 0,
      ultimate: casts.ultimateCasts || 0,
    },
  }
}

function computeOverview(stats) {
  const n = stats.length
  const wins = stats.filter(s => s.won).length

  const totalKills = stats.reduce((a, s) => a + s.stats.kills, 0)
  const totalDeaths = stats.reduce((a, s) => a + s.stats.deaths, 0)
  const totalDamage = stats.reduce((a, s) => a + s.stats.damage, 0)
  const totalRounds = stats.reduce((a, s) => a + (s.score.own + s.score.opp), 0)

  const totalHS = stats.reduce((a, s) => a + s.stats.headshots, 0)
  const totalBS = stats.reduce((a, s) => a + s.stats.bodyshots, 0)
  const totalLS = stats.reduce((a, s) => a + s.stats.legshots, 0)
  const totalShots = totalHS + totalBS + totalLS

  const agentMap = {}
  stats.forEach(s => {
    if (!agentMap[s.agent]) agentMap[s.agent] = { wins: 0, total: 0 }
    agentMap[s.agent].total++
    if (s.won) agentMap[s.agent].wins++
  })

  const mapMap = {}
  stats.forEach(s => {
    if (!mapMap[s.map]) mapMap[s.map] = { wins: 0, total: 0 }
    mapMap[s.map].total++
    if (s.won) mapMap[s.map].wins++
  })

  // "Current rank" is read from whichever match is most recent by start time —
  // matchlist ordering isn't guaranteed, so this is found explicitly rather
  // than assumed from array position.
  const mostRecent = stats.reduce((latest, s) =>
    (!latest || s.gameStartMillis > latest.gameStartMillis) ? s : latest, null)

  return {
    matches: n,
    wins,
    winRate: (wins / n) * 100,
    kd: totalKills / totalDeaths,
    adr: totalDamage / totalRounds,
    hsPercent: totalShots > 0 ? (totalHS / totalShots) * 100 : 0,
    agents: agentMap,
    maps: mapMap,
    rankTier: mostRecent?.rankTier ?? 0,
  }
}

function computeScores(stats) {
  const scores = {}

  scores.agentMismatch = scoreAgentMismatch(stats)
  scores.mapWeakness = scoreMapWeakness(stats)
  scores.sessionDegradation = scoreSessionDegradation(stats)
  scores.consistencyGap = scoreConsistencyGap(stats)
  scores.lowAssists = scoreLowAssists(stats)
  scores.abilityUnderutilization = scoreAbilityUnderutilization(stats)
  scores.economyDiscipline = scoreEconomyDiscipline(stats)

  return scores
}

function scoreAgentMismatch(stats) {
  const agentMap = {}
  stats.forEach(s => {
    if (!agentMap[s.agent]) agentMap[s.agent] = { wins: 0, total: 0, kd: [] }
    agentMap[s.agent].total++
    if (s.won) agentMap[s.agent].wins++
    agentMap[s.agent].kd.push(s.stats.kills / Math.max(s.stats.deaths, 1))
  })

  const agents = Object.entries(agentMap).map(([name, data]) => ({
    name,
    total: data.total,
    winRate: (data.wins / data.total) * 100,
    avgKd: data.kd.reduce((a, b) => a + b, 0) / data.kd.length,
  })).sort((a, b) => b.total - a.total)

  if (agents.length < 2) return { score: 0, data: null }

  const primary = agents[0]
  const best = [...agents].sort((a, b) => b.winRate - a.winRate)[0]
  const gap = best.winRate - primary.winRate

  return {
    score: Math.min(100, gap * 2),
    data: { primary, best, agents },
    label: 'Agent-role mismatch',
    description: `${primary.name} is your most-played agent (${primary.total} matches) with ${primary.winRate.toFixed(1)}% winrate. Your best agent ${best.name} has ${best.winRate.toFixed(1)}% over ${best.total} matches.`,
    fix: `Stop defaulting to ${primary.name}. Shift your primary to ${best.name} — the data supports it.`,
  }
}

function scoreMapWeakness(stats) {
  const mapData = {}
  stats.forEach(s => {
    if (!mapData[s.map]) mapData[s.map] = { wins: 0, total: 0 }
    mapData[s.map].total++
    if (s.won) mapData[s.map].wins++
  })

  const maps = Object.entries(mapData)
    .filter(([, d]) => d.total >= 3)
    .map(([map, d]) => ({ map, total: d.total, winRate: (d.wins / d.total) * 100 }))
    .sort((a, b) => a.winRate - b.winRate)

  if (maps.length < 2) return { score: 0, data: null }

  const worst = maps[0]
  const best = maps[maps.length - 1]
  const gap = best.winRate - worst.winRate

  return {
    score: Math.min(100, gap * 1.5),
    data: { worst, best, maps },
    label: 'Map weakness pattern',
    description: `Your winrate on ${worst.map} is ${worst.winRate.toFixed(1)}% vs ${best.winRate.toFixed(1)}% on ${best.map}. That's a ${gap.toFixed(0)}% gap — a consistent decision pattern, not variance.`,
    fix: `Study 2-3 of your ${worst.map} losses before queuing it again. Identify the rotation moment where rounds break.`,
  }
}

function scoreSessionDegradation(stats) {
  if (stats.length < 6) return { score: 0, data: null }

  const firstHalf = stats.slice(0, Math.floor(stats.length / 2))
  const secondHalf = stats.slice(Math.floor(stats.length / 2))

  const avgKdFirst = firstHalf.reduce((a, s) => a + s.stats.kills / Math.max(s.stats.deaths, 1), 0) / firstHalf.length
  const avgKdSecond = secondHalf.reduce((a, s) => a + s.stats.kills / Math.max(s.stats.deaths, 1), 0) / secondHalf.length
  const drop = avgKdFirst - avgKdSecond

  return {
    score: Math.min(100, Math.max(0, drop * 60)),
    data: { avgKdFirst, avgKdSecond, drop },
    label: 'Session degradation',
    description: `Your K/D drops from ${avgKdFirst.toFixed(2)} in earlier matches to ${avgKdSecond.toFixed(2)} in later ones. You're playing worse the longer you queue — tilt or fatigue.`,
    fix: `Cap sessions at 5 matches. Stop after 2 consecutive losses. Take a real break before requeuing.`,
  }
}

function scoreConsistencyGap(stats) {
  const kds = stats.map(s => s.stats.kills / Math.max(s.stats.deaths, 1))
  const avg = kds.reduce((a, b) => a + b, 0) / kds.length
  const variance = kds.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / kds.length
  const stdDev = Math.sqrt(variance)

  return {
    score: Math.min(100, stdDev * 40),
    data: { avg, stdDev, min: Math.min(...kds), max: Math.max(...kds) },
    label: 'Inconsistent performance floor',
    description: `Your K/D ranges from ${Math.min(...kds).toFixed(2)} to ${Math.max(...kds).toFixed(2)}. That variance means your floor is hurting you more than your ceiling helps.`,
    fix: `Focus on reducing bad games rather than chasing great ones. Consistent 1.1 beats spiking 2.0 and crashing to 0.5.`,
  }
}

function scoreLowAssists(stats) {
  const avgAssists = stats.reduce((a, s) => a + s.stats.assists, 0) / stats.length
  const avgKills = stats.reduce((a, s) => a + s.stats.kills, 0) / stats.length
  const ratio = avgAssists / Math.max(avgKills, 1)

  return {
    score: ratio < 0.2 ? Math.min(100, (0.2 - ratio) * 300) : 0,
    data: { avgAssists, avgKills, ratio },
    label: 'Low team contribution',
    description: `Your assists average ${avgAssists.toFixed(1)} per match against ${avgKills.toFixed(1)} kills. You're hunting individual kills instead of playing for your team's economy and space.`,
    fix: `On initiator or support agents, prioritize enabling your team over personal kills. Assists win rounds too.`,
  }
}

function scoreAbilityUnderutilization(stats) {
  if (stats.length === 0) return { score: 0, data: null }

  const avgTotal = stats.reduce((a, s) => {
    const total = Object.values(s.abilities).reduce((x, y) => x + (y || 0), 0)
    return a + total
  }, 0) / stats.length

  return {
    score: avgTotal < 8 ? Math.min(100, (8 - avgTotal) * 12) : 0,
    data: { avgTotal },
    label: 'Underusing abilities',
    description: `You're averaging ${avgTotal.toFixed(1)} ability casts per match. Unused utility is wasted economy — you're going into gunfights without the advantages your agent provides.`,
    fix: `Before each round ends, ask: did I use everything available? If not, why? Develop a habit of pre-round util planning.`,
  }
}

function scoreEconomyDiscipline(stats) {
  const avgDamage = stats.reduce((a, s) => a + s.stats.damage, 0) / stats.length
  const avgDamageTaken = stats.reduce((a, s) => a + s.stats.damageTaken, 0) / stats.length
  const dda = avgDamage - avgDamageTaken

  return {
    score: dda < 0 ? Math.min(100, Math.abs(dda) / 3) : 0,
    data: { avgDamage, avgDamageTaken, dda },
    label: 'Negative damage delta',
    description: `You're taking more damage than you deal on average (DDΔ ${dda.toFixed(0)}). You're losing duels more than you're winning them — positioning or timing issue.`,
    fix: `Take duels on your terms, not theirs. If you don't have an angle advantage, don't peek. Create the opportunity first.`,
  }
}

export function getPriorityFindings(scoredData) {
  if (!scoredData) return []

  const { scores } = scoredData

  return Object.values(scores)
    .filter(s => s.score > 0 && s.data)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}
