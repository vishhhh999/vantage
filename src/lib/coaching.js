import { supabase } from './supabase'

export async function generateCoachingReport(overview, priorities, riotId) {
  const prompt = buildPrompt(overview, priorities, riotId)

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You need to be signed in to generate a report.')

  const res = await fetch('/api/anthropic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: `You are VANTAGE, an AI Valorant performance coach. You analyze match data and give direct, specific coaching feedback.

Rules:
- Only make claims the data directly supports. No guessing.
- Never give generic advice like "communicate more" or "practice aim".
- Every insight must reference a specific number or pattern from the match data provided.
- Speak directly to the player. No fluff, no hedging.
- Output must be valid JSON only. No preamble, no markdown fences.`,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to generate coaching report')
  }

  const data = await res.json()
  const text = data.content?.[0]?.text || ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { summary: text, priorities: [] }
  }
}

function buildPrompt(overview, priorities, riotId) {
  return `Analyze this Valorant player and return a coaching report as JSON.

Player: ${riotId}
Matches analyzed: ${overview.matches}
Win rate: ${overview.winRate.toFixed(1)}%
K/D: ${overview.kd.toFixed(2)}
ADR: ${overview.adr.toFixed(0)}
HS%: ${overview.hsPercent.toFixed(1)}%

Top agent winrates:
${Object.entries(overview.agents).map(([name, d]) => `${name}: ${((d.wins/d.total)*100).toFixed(1)}% (${d.total} games)`).join('\n')}

Map winrates:
${Object.entries(overview.maps).map(([map, d]) => `${map}: ${((d.wins/d.total)*100).toFixed(1)}% (${d.total} games)`).join('\n')}

Detected error patterns (pre-scored):
${priorities.map((p, i) => `${i+1}. ${p.label} (severity: ${p.score.toFixed(0)}/100)\n   ${p.description}\n   Suggested fix: ${p.fix}`).join('\n\n')}

Return ONLY this JSON structure, nothing else:
{
  "summary": "2-3 sentence blunt summary of this player's biggest problem right now",
  "priorities": [
    {
      "rank": 1,
      "label": "short label",
      "finding": "specific finding referencing the data",
      "fix": "one concrete behavioral adjustment",
      "severity": "critical|high|medium"
    }
  ]
}`
}
