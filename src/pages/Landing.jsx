import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

const REGIONS = [
  { value: 'ap', label: 'AP (SEA / OCE)' },
  { value: 'na', label: 'NA' },
  { value: 'eu', label: 'EU' },
  { value: 'kr', label: 'KR' },
]

export default function Landing() {
  const [riotId, setRiotId] = useState('')
  const [region, setRegion] = useState('ap')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleAnalyze(e) {
    e.preventDefault()
    const trimmed = riotId.trim()
    if (!trimmed.includes('#')) {
      setError('Enter your Riot ID in the format Name#TAG')
      return
    }
    setError('')
    const encoded = encodeURIComponent(trimmed)
    navigate(`/report/${encoded}?region=${region}`)
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
        <div className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#sample">Sample report</a>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>AI coaching for Valorant</p>
          <h1 className={styles.headline}>
            Find out what's<br />
            <span className={styles.headlineMuted}>actually costing you rounds.</span>
          </h1>
          <p className={styles.sub}>
            You play, we analyze. VANTAGE reads your last 20 matches and tells you exactly which decisions are losing you games — and what to change. No stat dumps. Just coaching.
          </p>

          <form className={styles.inputRow} onSubmit={handleAnalyze}>
            <input
              className={styles.riotInput}
              type="text"
              placeholder="YourName#TAG"
              value={riotId}
              onChange={e => { setRiotId(e.target.value); setError('') }}
              autoComplete="off"
              spellCheck={false}
            />
            <select
              className={styles.regionSelect}
              value={region}
              onChange={e => setRegion(e.target.value)}
            >
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button className={styles.cta} type="submit">Analyze</button>
          </form>
          {error && <p className={styles.inputError}>{error}</p>}
          <p className={styles.inputNote}>Your account must be public. Free to use.</p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.statNum}>20</span>
            <span className={styles.statLabel}>Matches analyzed</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statNum}>12</span>
            <span className={styles.statLabel}>Error categories</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statNum}>3</span>
            <span className={styles.statLabel}>Priority fixes per session</span>
          </div>
        </div>
      </section>

      <section className={styles.howSection} id="how">
        <p className={styles.sectionEyebrow}>How it works</p>
        <h2 className={styles.sectionHeadline}>
          From your Riot ID to a <span>coaching report.</span>
        </h2>
        <div className={styles.steps}>
          {[
            {
              num: '01',
              title: 'Enter your Riot ID',
              desc: 'No installs, no screen capture. Just paste your Riot ID and region. VANTAGE pulls your last 20 competitive matches directly from the official Riot API.'
            },
            {
              num: '02',
              title: 'We find your patterns',
              desc: 'Every match is scored across 12 decision categories — economy, rotation, role discipline, util timing, clutch reads, map patterns. Not what happened. Why.'
            },
            {
              num: '03',
              title: 'Get 3 things to fix',
              desc: 'Your highest-impact errors become your focus. Each finding shows the specific pattern, why it\'s costing you rounds, and one concrete thing to change next session.'
            }
          ].map(step => (
            <div className={styles.step} key={step.num}>
              <span className={styles.stepNum}>{step.num}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.sampleSection} id="sample">
        <p className={styles.sectionEyebrow}>Sample output</p>
        <h2 className={styles.sectionHeadline}>
          Not stats. <span>Decisions.</span>
        </h2>
        <div className={styles.sampleCard}>
          <div className={styles.sampleHeader}>
            <span className={styles.sampleTitle}>Vantage Report — john pork#hax</span>
            <span className={styles.sampleMeta}>Platinum 1 · 20 matches · AP</span>
          </div>
          <div className={styles.sampleSummary}>
            Your biggest issue isn't mechanics — it's playing the wrong agent 38% of the time and not stopping when your sessions fall apart.
          </div>
          {[
            {
              rank: 1,
              severity: 'critical',
              label: 'Agent-role mismatch',
              finding: 'Raze is your most-played agent (53 matches) with a 45.3% winrate. Your Jett winrate is 65.2% over 23 matches. You\'re defaulting to the wrong agent every session.',
              fix: 'Make Jett your primary. Raze is situational only — specific maps where her kit has a clear advantage.'
            },
            {
              rank: 2,
              severity: 'high',
              label: 'Split & Bind are bleeding rounds',
              finding: 'Split: DDΔ -30, -45 in recent matches. Bind: 42.9% winrate, recurring negative damage delta. Haven: 75%. You read 3-site maps correctly — your rotation logic breaks on tight corridor maps.',
              fix: 'Study your Split and Bind losses before queuing them again. Identify where you\'re rotating — specifically the timing.'
            },
            {
              rank: 3,
              severity: 'high',
              label: 'Session degradation',
              finding: 'You played 10 matches on March 11. Your DDΔ ceiling is +99, your floor is -45. Late-session collapse is consistent — you\'re not recognizing when you\'re tilting.',
              fix: 'Cap at 5 matches per session. Stop after 2 consecutive losses with negative DDΔ. The data shows you don\'t recover in the same session.'
            }
          ].map(p => (
            <div className={styles.priorityBlock} key={p.rank} data-severity={p.severity}>
              <div className={styles.priorityMeta}>
                <span className={styles.priorityLabel} data-severity={p.severity}>
                  <span className={styles.priorityDot} />
                  Priority {p.rank}
                </span>
                <span className={styles.severityTag} data-severity={p.severity}>{p.severity}</span>
              </div>
              <h3 className={styles.priorityTitle}>{p.label}</h3>
              <p className={styles.priorityFinding}>{p.finding}</p>
              <p className={styles.priorityFix}>{p.fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaHeadline}>
          Start your next session<br /><span>knowing what to fix.</span>
        </h2>
        <p className={styles.ctaSub}>Free to use. No account needed to start.</p>
        <form className={styles.inputRow} onSubmit={handleAnalyze}>
          <input
            className={styles.riotInput}
            type="text"
            placeholder="YourName#TAG"
            value={riotId}
            onChange={e => { setRiotId(e.target.value); setError('') }}
            autoComplete="off"
            spellCheck={false}
          />
          <select
            className={styles.regionSelect}
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            {REGIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button className={styles.cta} type="submit">Analyze</button>
        </form>
        {error && <p className={styles.inputError}>{error}</p>}
      </section>

      <footer className={styles.footer}>
        <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
        <span className={styles.footerNote}>Not affiliated with Riot Games, Inc.</span>
      </footer>
    </div>
  )
}
