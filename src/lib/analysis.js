import { fetchPlayerData } from './riot'
import { scoreMatches, getPriorityFindings, getRankName } from './scoring'
import { generateCoachingReport } from './coaching'

// Runs the full pipeline: Riot API -> scoring -> Claude coaching.
// Shared by the anonymous /report flow and the signed-in dashboard flow
// so both stay in sync as the scoring logic evolves.
export async function runFullAnalysis(riotId, region = 'ap', onStage = () => {}) {
  onStage(0)
  const { account, matches, resolver } = await fetchPlayerData(riotId, region)

  onStage(1)
  const scored = scoreMatches(matches, account.puuid, resolver)
  if (!scored) throw new Error('Not enough match data. Make sure your profile is public.')
  const priorities = getPriorityFindings(scored)
  const overview = { ...scored.overview, rankName: getRankName(scored.overview.rankTier) }

  onStage(2)
  const coaching = await generateCoachingReport(overview, priorities, riotId)

  const displayPriorities = coaching.priorities?.length > 0
    ? coaching.priorities
    : priorities.map((p, i) => ({
        rank: i + 1,
        label: p.label,
        finding: p.description,
        fix: p.fix,
        severity: i === 0 ? 'critical' : i === 1 ? 'high' : 'medium'
      }))

  return {
    puuid: account.puuid,
    overview,
    priorities: displayPriorities,
    rawScores: priorities,
    summary: coaching.summary || '',
  }
}
