import { supabase } from './supabase'

const COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function linkRiotId(userId, riotId, region) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, riot_id: riotId, region }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLatestReport(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getFirstReport(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getReportHistory(userId, limit = 6) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function saveReport(userId, riotId, region, analysis) {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      riot_id: riotId,
      region,
      overview: analysis.overview,
      priorities: analysis.priorities,
      summary: analysis.summary,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function msUntilNextAnalysis(latestReport) {
  if (!latestReport) return 0
  const elapsed = Date.now() - new Date(latestReport.created_at).getTime()
  return Math.max(0, COOLDOWN_MS - elapsed)
}

export { COOLDOWN_MS }
