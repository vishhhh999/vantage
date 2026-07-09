import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getCurrentUser, getProfile, linkRiotId, getLatestReport,
  getFirstReport, getReportHistory, saveReport, msUntilNextAnalysis
} from '../lib/dashboard'
import { runFullAnalysis } from '../lib/analysis'
import { isRsoConfigured, buildRiotAuthorizeUrl } from '../lib/riotAuth'
import { agentIconPath, rankBadgePath } from '../lib/assets'
import styles from './Dashboard.module.css'

const REGIONS = [
  { value: 'ap', label: 'AP — SEA / OCE' },
  { value: 'na', label: 'NA' },
  { value: 'eu', label: 'EU' },
  { value: 'kr', label: 'KR' },
]

const STAGES = ['Pulling your match history...', 'Scoring decision patterns...', 'Generating coaching report...']

function describeAnalysisError(err) {
  const msg = err?.message || ''
  if (/forbidden/i.test(msg) || /\b403\b/.test(msg)) {
    return "Riot requires you to sign in directly through Riot (RSO) before match history can be read — this isn't a bug on our end. Your account is linked, but analysis can't run until Riot finishes enabling that for VANTAGE. Try again once RSO sign-in is live."
  }
  if (/no competitive matches/i.test(msg)) {
    return msg
  }
  return msg || 'Analysis failed. Try again shortly.'
}

function VantageLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="16,2 30,28 2,28" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="16,10 24,26 8,26" fill="#FF4655" fillOpacity="0.1" stroke="#FF4655" strokeWidth="1" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="28" stroke="#FF4655" strokeWidth="1" strokeOpacity="0.25"/>
    </svg>
  )
}

function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function TrendStat({ label, first, latest, suffix = '', decimals = 0, invertGood = false }) {
  if (first == null || latest == null) return null
  const delta = latest - first
  const improved = invertGood ? delta < 0 : delta > 0
  const flat = Math.abs(delta) < 0.05
  return (
    <div className={styles.trendStat}>
      <span className={styles.trendLabel}>{label}</span>
      <div className={styles.trendValues}>
        <span className={styles.trendNum}>{latest.toFixed(decimals)}{suffix}</span>
        {!flat && (
          <span className={styles.trendDelta} data-good={improved}>
            {delta > 0 ? '+' : ''}{delta.toFixed(decimals)}{suffix}
          </span>
        )}
        {flat && <span className={styles.trendFlat}>flat</span>}
      </div>
      <span className={styles.trendFrom}>from {first.toFixed(decimals)}{suffix} at start</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | no-profile | ready | error
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [latestReport, setLatestReport] = useState(null)
  const [firstReport, setFirstReport] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  const [linkRiotIdInput, setLinkRiotIdInput] = useState('')
  const [linkRegion, setLinkRegion] = useState('ap')
  const [linkError, setLinkError] = useState('')
  const [linking, setLinking] = useState(false)

  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [analyzeStage, setAnalyzeStage] = useState(0)
  const [cooldownMs, setCooldownMs] = useState(0)
  const tickRef = useRef(null)

  const loadDashboard = useCallback(async (currentUser, { autoRefresh = true } = {}) => {
    const prof = await getProfile(currentUser.id)
    if (!prof) {
      setStatus('no-profile')
      return
    }
    setProfile(prof)

    let latest = await getLatestReport(currentUser.id)
    const remaining = msUntilNextAnalysis(latest)
    let refreshError = null

    if (autoRefresh && remaining === 0) {
      // Enough time has passed since the last analysis (or none exists) — refresh
      // automatically. If this fails (e.g. Riot 403s because RSO isn't live yet),
      // it must NOT take down the whole dashboard — the profile is real and the
      // page should still render, just with a clear inline explanation.
      try {
        latest = await runAnalysisAndSave(currentUser.id, prof.riot_id, prof.region)
      } catch (err) {
        refreshError = describeAnalysisError(err)
      }
    }

    const [first, hist] = await Promise.all([
      getFirstReport(currentUser.id),
      getReportHistory(currentUser.id),
    ])

    setLatestReport(latest)
    setFirstReport(first)
    setHistory(hist)
    setCooldownMs(msUntilNextAnalysis(latest))
    setAnalysisError(refreshError)
    setStatus('ready')
  }, [])

  async function runAnalysisAndSave(userId, riotId, region) {
    setAnalyzing(true)
    setAnalyzeStage(0)
    try {
      const analysis = await runFullAnalysis(riotId, region, setAnalyzeStage)
      const saved = await saveReport(userId, riotId, region, analysis)
      return saved
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const u = await getCurrentUser()
        if (!u) { navigate('/login'); return }
        if (cancelled) return
        setUser(u)
        await loadDashboard(u, { autoRefresh: true })
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dashboard')
          setStatus('error')
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [loadDashboard, navigate])

  // Live countdown tick
  useEffect(() => {
    if (cooldownMs <= 0) return
    tickRef.current = setInterval(() => {
      setCooldownMs(ms => Math.max(0, ms - 1000))
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [cooldownMs > 0])

  const rsoConfigured = isRsoConfigured()

  function handleRiotSignIn() {
    // `state` carries no secret — it's just a CSRF-style nonce. Identity
    // linking happens after the callback via the already-authenticated
    // Supabase session, not via this value.
    const state = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    window.location.href = buildRiotAuthorizeUrl(state)
  }

  async function handleLinkSubmit(e) {
    e.preventDefault()
    const trimmed = linkRiotIdInput.trim()
    if (!trimmed.includes('#')) { setLinkError('Use the format Name#TAG'); return }
    setLinkError('')
    setLinking(true)
    try {
      // Linking the profile is a real, independent success — commit it even if
      // the analysis that follows fails (e.g. RSO not live yet).
      const prof = await linkRiotId(user.id, trimmed, linkRegion)
      setProfile(prof)
      setStatus('ready')
      setAnalysisError('')
      try {
        const saved = await runAnalysisAndSave(user.id, prof.riot_id, prof.region)
        setLatestReport(saved)
        setFirstReport(saved)
        setHistory([saved])
        setCooldownMs(msUntilNextAnalysis(saved))
      } catch (analysisErr) {
        setAnalysisError(describeAnalysisError(analysisErr))
      }
    } catch (err) {
      setLinkError(err.message || 'Failed to link Riot ID')
    } finally {
      setLinking(false)
    }
  }

  async function handleManualRerun() {
    if (cooldownMs > 0 || analyzing) return
    setAnalysisError('')
    try {
      const saved = await runAnalysisAndSave(user.id, profile.riot_id, profile.region)
      setLatestReport(saved)
      setHistory(h => [saved, ...h].slice(0, 6))
      setCooldownMs(msUntilNextAnalysis(saved))
    } catch (err) {
      setAnalysisError(describeAnalysisError(err))
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className={styles.centerPage}>
        <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
        <p className={styles.loadingText}>Loading your dashboard...</p>
      </div>
    )
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div className={styles.centerPage}>
        <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
        <p className={styles.errorText}>{error}</p>
        <Link to="/" className={styles.linkBtn}>← Back to home</Link>
      </div>
    )
  }

  // ── No linked Riot ID yet ──
  if (status === 'no-profile') {
    return (
      <div className={styles.centerPage}>
        <div className={`${styles.linkCard} v-cut-lg`}>
          <div className={styles.linkCardHeader}>
            <VantageLogo size={26} />
            <span className={styles.wordmark}>VANTAGE</span>
          </div>
          <h1 className={styles.linkTitle}>Link your Riot account</h1>
          <p className={styles.linkSubtitle}>
            Sign in with Riot to verify it's really you. VANTAGE will auto-refresh your coaching report each time you sign in.
          </p>

          {rsoConfigured ? (
            <button className={`${styles.linkSubmitBtn} v-cut-sm`} onClick={handleRiotSignIn}>
              Sign in with Riot Games
            </button>
          ) : (
            <>
              <div className={styles.rsoNotice}>
                Riot sign-in isn't wired up yet on this deployment. Using manual entry below for now — match analysis
                will fail until RSO credentials are configured, since Riot requires players to authenticate before
                their match history can be read.
              </div>
              <form onSubmit={handleLinkSubmit} className={styles.linkForm}>
                <div className={styles.linkFields}>
                  <input
                    className={styles.linkInput}
                    type="text"
                    placeholder="YourName#TAG"
                    value={linkRiotIdInput}
                    onChange={e => { setLinkRiotIdInput(e.target.value); setLinkError('') }}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                  />
                  <select className={styles.linkRegionSelect} value={linkRegion} onChange={e => setLinkRegion(e.target.value)}>
                    {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {linkError && <p className={styles.linkErrorMsg}>{linkError}</p>}
                <button className={`${styles.linkSubmitBtn} v-cut-sm`} type="submit" disabled={linking}>
                  {linking ? 'Linking & analyzing...' : 'Link account (manual, no RSO)'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Analyzing (first run or manual re-run) ──
  if (analyzing && !latestReport) {
    return (
      <div className={styles.centerPage}>
        <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
        <div className={styles.loadingStages}>
          {STAGES.map((s, i) => (
            <div key={s} className={styles.loadingStage} data-active={i === analyzeStage} data-done={i < analyzeStage}>
              <span className={styles.stageDot} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const overview = latestReport?.overview
  const firstOverview = firstReport?.overview
  const isFirstReport = firstReport && latestReport && firstReport.id === latestReport.id

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.navBrand}>
          <VantageLogo size={20} />
          <span className={styles.wordmark}>VANTAGE</span>
        </Link>
        <div className={styles.navRight}>
          <span className={styles.navRiotId}>{profile.riot_id}</span>
          <button className={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Dashboard</p>
          <div className={styles.headerRow}>
            <div className={styles.riotIdRow}>
              {overview?.rankName && rankBadgePath(overview.rankName) && (
                <img src={rankBadgePath(overview.rankName)} alt={overview.rankName} className={styles.rankBadgeImg} />
              )}
              <div>
                <h1 className={styles.riotIdHeading}>{profile.riot_id}</h1>
                {overview?.rankName && <p className={styles.rankName}>{overview.rankName}</p>}
              </div>
            </div>
            <button
              className={`${styles.rerunBtn} v-cut-sm`}
              onClick={handleManualRerun}
              disabled={cooldownMs > 0 || analyzing}
            >
              {analyzing ? 'Analyzing...' : cooldownMs > 0 ? `Next analysis in ${formatCountdown(cooldownMs)}` : 'Re-run analysis'}
            </button>
          </div>
          {overview && (
            <div className={styles.overviewRow}>
              <div className={styles.overviewStat}><span className={styles.overviewNum}>{overview.matches}</span><span className={styles.overviewLabel}>Matches</span></div>
              <div className={styles.overviewStat}><span className={styles.overviewNum}>{overview.winRate.toFixed(0)}%</span><span className={styles.overviewLabel}>Win rate</span></div>
              <div className={styles.overviewStat}><span className={styles.overviewNum}>{overview.kd.toFixed(2)}</span><span className={styles.overviewLabel}>K/D</span></div>
              <div className={styles.overviewStat}><span className={styles.overviewNum}>{overview.adr.toFixed(0)}</span><span className={styles.overviewLabel}>ADR</span></div>
              <div className={styles.overviewStat}><span className={styles.overviewNum}>{overview.hsPercent.toFixed(0)}%</span><span className={styles.overviewLabel}>HS%</span></div>
            </div>
          )}
          <p className={styles.lastUpdated}>
            Last analyzed {latestReport ? new Date(latestReport.created_at).toLocaleString() : '—'}
          </p>
        </header>

        {analysisError && (
          <div className={`${styles.analysisErrorBanner} v-cut-md`}>
            <span className={styles.analysisErrorLabel}>Analysis unavailable</span>
            <p>{analysisError}</p>
          </div>
        )}

        {!latestReport && !analysisError && (
          <div className={`${styles.emptyState} v-cut-md`}>
            <p>No analysis yet. Click <strong>Re-run analysis</strong> above to generate your first report.</p>
          </div>
        )}

        {latestReport?.summary && (
          <div className={`${styles.summary} v-cut-md`}>
            <p className={styles.summaryLabel}>Coach summary</p>
            <p className={styles.summaryText}>{latestReport.summary}</p>
          </div>
        )}

        <div className={styles.priorities}>
          <p className={styles.sectionLabel}>Priority findings</p>
          {(latestReport?.priorities || []).map(p => (
            <div className={`${styles.priorityBlock} v-cut-md`} key={p.rank} data-severity={p.severity}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityMeta}>
                  <span className={styles.priorityRank} data-severity={p.severity}><span className={styles.rankDot} />Priority {p.rank}</span>
                  <span className={styles.severityBadge} data-severity={p.severity}>{p.severity}</span>
                </div>
                <h2 className={styles.priorityTitle}>{p.label}</h2>
              </div>
              <p className={styles.priorityFinding}>{p.finding}</p>
              <div className={`${styles.priorityFix} v-cut-sm`}><span className={styles.fixLabel}>Fix</span><p>{p.fix}</p></div>
            </div>
          ))}
        </div>

        {overview?.agents && Object.keys(overview.agents).length > 0 && (
          <div className={`${styles.agentBreakdown} v-cut-md`}>
            <p className={styles.sectionLabel}>Agent breakdown</p>
            <div className={styles.agentGrid}>
              {Object.entries(overview.agents)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([agent, data]) => {
                  const wr = (data.wins / data.total) * 100
                  const icon = agentIconPath(agent)
                  return (
                    <div className={styles.agentRow} key={agent}>
                      {icon && <img src={icon} alt={agent} className={styles.agentIcon} />}
                      <span className={styles.agentName}>{agent}</span>
                      <div className={styles.agentBar}>
                        <div className={styles.agentFill} style={{ width: `${wr}%` }} data-good={wr >= 50} />
                      </div>
                      <span className={styles.agentWr} data-good={wr >= 50}>{wr.toFixed(0)}%</span>
                      <span className={styles.agentGames}>{data.total}g</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {!isFirstReport && firstOverview && overview && (
          <div className={styles.progressSection}>
            <p className={styles.sectionLabel}>Your progress with VANTAGE</p>
            <p className={styles.progressNote}>
              Comparing your first analysis ({new Date(firstReport.created_at).toLocaleDateString()}) to your latest.
            </p>
            <div className={styles.trendGrid}>
              <TrendStat label="Win rate" first={firstOverview.winRate} latest={overview.winRate} suffix="%" decimals={1} />
              <TrendStat label="K/D" first={firstOverview.kd} latest={overview.kd} decimals={2} />
              <TrendStat label="ADR" first={firstOverview.adr} latest={overview.adr} decimals={0} />
              <TrendStat label="HS%" first={firstOverview.hsPercent} latest={overview.hsPercent} suffix="%" decimals={1} />
            </div>
          </div>
        )}

        {history.length > 1 && (
          <div className={styles.historySection}>
            <p className={styles.sectionLabel}>Report history</p>
            <div className={styles.historyList}>
              {history.map(r => (
                <div className={styles.historyRow} key={r.id}>
                  <span className={styles.historyDate}>{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className={styles.historyStat}>{r.overview.winRate.toFixed(0)}% WR</span>
                  <span className={styles.historyStat}>{r.overview.kd.toFixed(2)} K/D</span>
                  <span className={styles.historyTop}>{r.priorities?.[0]?.label || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <Link to="/" className={styles.newAnalysis}>← Back to home</Link>
          <div className={styles.footerRight}>
            <span className={styles.betaBadge}>v3-beta</span>
            <p className={styles.footerNote}>Not affiliated with Riot Games</p>
          </div>
        </div>
      </div>
    </div>
  )
}
