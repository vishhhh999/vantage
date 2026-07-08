import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import styles from './Landing.module.css'

const REGIONS = [
  { value: 'ap', label: 'AP — SEA / OCE' },
  { value: 'na', label: 'NA' },
  { value: 'eu', label: 'EU' },
  { value: 'kr', label: 'KR' },
]

const SAMPLE_PRIORITIES = [
  {
    rank: 1, severity: 'critical',
    label: 'Agent-role mismatch',
    stat: '45.3% WR on main',
    finding: 'You\'ve played Raze in 53 of your last 139 matches with a 45.3% winrate. Your Jett winrate is 65.2% over 23 matches — a 20-point gap. You\'re defaulting to the wrong agent every session based on habit, not data.',
    fix: 'Make Jett your primary. The winrate gap is too large to ignore. Raze is situational — maps with long sightlines where her blast pack creates genuine angles.',
    rounds: 'Costs est. 4–6 rounds per session'
  },
  {
    rank: 2, severity: 'high',
    label: 'Map-specific decision breakdown',
    stat: '31.6% WR on Corrode',
    finding: 'Corrode: 31.6% (6W–12L). Bind: 42.9% (9W–12L). Split: 45.5% (10W–11L). Haven: 75% (15W–5L). Your read on 3-site maps is strong. Your rotation logic breaks on maps with tight corridors and faster rotations — you\'re playing the same tempo regardless of map geometry.',
    fix: 'On Corrode and Bind, slow your default tempo by one beat. These maps punish commitment — read before pushing, don\'t push to read.',
    rounds: 'Costs est. 3–5 rounds per session'
  },
  {
    rank: 3, severity: 'high',
    label: 'Session degradation pattern',
    stat: 'K/D drops 0.4 after match 6',
    finding: 'You played 10 matches on March 11 with a 1.09 K/D average. Your DDΔ that day was +9 — nearly neutral despite winning 5. Your best single match this period was 2.1 K/D (30/14). Your worst was 0.5 K/D (8/16). That\'s the same player in the same week. The floor is costing you more than the ceiling gains.',
    fix: 'Hard cap: 5 matches per session. Rule: if you go 2 consecutive losses with negative DDΔ, you stop. Not pause — stop. The data shows you do not recover within the same session.',
    rounds: 'Costs est. 5–8 rounds per session'
  }
]

function VantageLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 30,28 2,28" fill="none" stroke="#b8f5a0" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="16,10 24,26 8,26" fill="#b8f5a0" fillOpacity="0.12" stroke="#b8f5a0" strokeWidth="1" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="28" stroke="#b8f5a0" strokeWidth="1" strokeOpacity="0.3"/>
    </svg>
  )
}

function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    let mouse = { x: 0, y: 0 }

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    function init() {
      particles = []
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 8000)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.4 + 0.1,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.offsetWidth
        if (p.x > canvas.offsetWidth) p.x = 0
        if (p.y < 0) p.y = canvas.offsetHeight
        if (p.y > canvas.offsetHeight) p.y = 0

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const glow = dist < 120 ? (1 - dist / 120) * 0.6 : 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(184,245,160,${p.opacity + glow})`
        ctx.fill()
      })

      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(184,245,160,${0.06 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animId = requestAnimationFrame(draw)
    }

    function onMouse(e) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    resize()
    init()
    draw()
    window.addEventListener('resize', () => { resize(); init() })
    canvas.addEventListener('mousemove', onMouse)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.particleCanvas} />
}

function FadeUp({ children, delay = 0, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function HowStep({ num, title, desc, icon, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      className={styles.step}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.stepIcon}>{icon}</div>
      <span className={styles.stepNum}>{num}</span>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{desc}</p>
    </motion.div>
  )
}

export default function Landing() {
  const [riotId, setRiotId] = useState('')
  const [region, setRegion] = useState('ap')
  const [error, setError] = useState('')
  const [activePriority, setActivePriority] = useState(0)
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  function handleAnalyze(e) {
    e.preventDefault()
    const trimmed = riotId.trim()
    if (!trimmed.includes('#')) {
      setError('Use the format Name#TAG')
      return
    }
    setError('')
    navigate(`/report/${encodeURIComponent(trimmed)}?region=${region}`)
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <VantageLogo size={22} />
          <span className={styles.wordmark}>VANTAGE</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#sample">Sample report</a>
        </div>
        <a href="/login" className={styles.navLogin}>Sign in</a>
      </nav>

      <section className={styles.hero}>
        <ParticleField />
        <motion.div className={styles.heroInner} style={{ y: heroY, opacity: heroOpacity }}>
          <motion.p
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className={styles.eyebrowDot} />
            AI coaching for Valorant
          </motion.p>

          <motion.h1
            className={styles.headline}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.headlineLine1}>Find out what's</span>
            <span className={styles.headlineLine2}>actually costing</span>
            <span className={styles.headlineLine3}>you rounds.</span>
          </motion.h1>

          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            VANTAGE reads your last 20 competitive matches and tells you<br />
            exactly which decisions are losing you games — and what to change.
          </motion.p>

          <motion.form
            className={styles.inputRow}
            onSubmit={handleAnalyze}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <div className={styles.inputWrap}>
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
            </div>
            <button className={styles.cta} type="submit">
              Analyze my matches
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {error && <p className={styles.inputError}>{error}</p>}
          </motion.form>

          <motion.p
            className={styles.inputNote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Free to use · Public profile required · No installs
          </motion.p>
        </motion.div>

        <motion.div
          className={styles.heroScroll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className={styles.scrollLine} />
          <span>Scroll</span>
        </motion.div>
      </section>

      <section className={styles.statsBar}>
        {[
          { num: '20', label: 'Matches analyzed' },
          { num: '12', label: 'Error categories' },
          { num: '3', label: 'Priority fixes' },
          { num: '<60s', label: 'Analysis time' },
        ].map((s, i) => (
          <FadeUp key={s.label} delay={i * 0.08}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </FadeUp>
        ))}
      </section>

      <section className={styles.howSection} id="how">
        <FadeUp>
          <p className={styles.sectionEyebrow}>
            <span className={styles.eyebrowDot} />
            How it works
          </p>
          <h2 className={styles.sectionHeadline}>
            From Riot ID to<br /><span>coaching report.</span>
          </h2>
        </FadeUp>

        <div className={styles.steps}>
          <HowStep
            num="01"
            title="Enter your Riot ID"
            desc="No installs. No screen capture. Paste your Riot ID and select your region. We pull your last 20 competitive matches directly from the official Riot API."
            delay={0}
            icon={
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="12" width="32" height="24" rx="3" stroke="#b8f5a0" strokeWidth="1.5"/>
                <path d="M16 20h16M16 24h10" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="36" cy="12" r="6" fill="#0e0e0e" stroke="#b8f5a0" strokeWidth="1.5"/>
                <path d="M34 12l1.5 1.5L38 10" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <HowStep
            num="02"
            title="We score your decisions"
            desc="Every match is parsed across 12 decision categories — economy, rotation, role discipline, util timing, clutch reads, map patterns. Not what happened. Why it happened."
            delay={0.1}
            icon={
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="14" stroke="#b8f5a0" strokeWidth="1.5"/>
                <path d="M24 10v4M24 34v4M10 24h4M34 24h4" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="24" cy="24" r="4" fill="#b8f5a0" fillOpacity="0.2" stroke="#b8f5a0" strokeWidth="1.5"/>
                <path d="M24 24l6-6" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          />
          <HowStep
            num="03"
            title="Get 3 things to fix"
            desc="Your highest-impact errors become your focus. Each finding shows the specific pattern, why it's costing rounds, and one concrete behavioral adjustment for next session."
            delay={0.2}
            icon={
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 16h20M14 24h14M14 32h8" stroke="#5c5751" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 16h20M14 24h14" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="36" cy="32" r="6" fill="#b8f5a0" fillOpacity="0.1" stroke="#b8f5a0" strokeWidth="1.5"/>
                <path d="M33.5 32l1.5 1.5 3-3" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
        </div>

        <div className={styles.howDiagram}>
          <FadeUp delay={0.1}>
            <div className={styles.diagramFlow}>
              {['Riot ID', 'Match API', 'Scoring', 'AI Coach', 'Report'].map((label, i) => (
                <div key={label} className={styles.diagramStep}>
                  <div className={styles.diagramNode}>
                    <span>{label}</span>
                  </div>
                  {i < 4 && (
                    <div className={styles.diagramArrow}>
                      <svg width="32" height="2" viewBox="0 0 32 2">
                        <line x1="0" y1="1" x2="28" y2="1" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3 3"/>
                      </svg>
                      <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
                        <path d="M0 0l6 4-6 4" fill="#3d3d3d"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <section className={styles.sampleSection} id="sample">
        <FadeUp>
          <p className={styles.sectionEyebrow}>
            <span className={styles.eyebrowDot} />
            Sample report
          </p>
          <h2 className={styles.sectionHeadline}>
            Not stats.<br /><span>Decisions.</span>
          </h2>
          <p className={styles.sampleIntro}>
            Every other tool shows you what happened.<br />VANTAGE tells you why you lost the round — and what to change.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className={styles.sampleReport}>
            <div className={styles.reportHeader}>
              <div className={styles.reportHeaderLeft}>
                <VantageLogo size={18} />
                <div>
                  <p className={styles.reportTitle}>john pork#hax</p>
                  <p className={styles.reportMeta}>Platinum 1 · 20 matches · AP region</p>
                </div>
              </div>
              <div className={styles.reportOverview}>
                {[
                  { val: '48.9%', label: 'Win rate' },
                  { val: '1.18', label: 'K/D' },
                  { val: '158.6', label: 'ADR' },
                  { val: '17.3%', label: 'HS%' },
                ].map(s => (
                  <div key={s.label} className={styles.reportStat}>
                    <span className={styles.reportStatNum}>{s.val}</span>
                    <span className={styles.reportStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.reportSummary}>
              <p className={styles.reportSummaryLabel}>Coach summary</p>
              <p className={styles.reportSummaryText}>
                Your ceiling is clearly Immortal — the data proves it. Your floor is what's keeping you in Platinum. Three patterns are responsible for the gap between your best and worst games. Fix these in order.
              </p>
            </div>

            <div className={styles.reportBody}>
              <div className={styles.priorityNav}>
                {SAMPLE_PRIORITIES.map((p, i) => (
                  <button
                    key={p.rank}
                    className={styles.priorityTab}
                    data-active={activePriority === i}
                    data-severity={p.severity}
                    onClick={() => setActivePriority(i)}
                  >
                    <span className={styles.tabDot} data-severity={p.severity} />
                    <span className={styles.tabNum}>0{p.rank}</span>
                    <span className={styles.tabLabel}>{p.label}</span>
                  </button>
                ))}
              </div>

              <motion.div
                key={activePriority}
                className={styles.priorityDetail}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.detailHeader}>
                  <div className={styles.detailMeta}>
                    <span className={styles.detailRank} data-severity={SAMPLE_PRIORITIES[activePriority].severity}>
                      <span className={styles.rankDot} />
                      Priority {SAMPLE_PRIORITIES[activePriority].rank}
                    </span>
                    <span className={styles.detailStat}>{SAMPLE_PRIORITIES[activePriority].stat}</span>
                  </div>
                  <h3 className={styles.detailTitle}>{SAMPLE_PRIORITIES[activePriority].label}</h3>
                </div>
                <p className={styles.detailFinding}>{SAMPLE_PRIORITIES[activePriority].finding}</p>
                <div className={styles.detailFix}>
                  <span className={styles.fixTag}>Fix</span>
                  <p>{SAMPLE_PRIORITIES[activePriority].fix}</p>
                </div>
                <div className={styles.detailImpact}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#f2994a" strokeWidth="1"/>
                    <path d="M6 4v3M6 8.5v.5" stroke="#f2994a" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  <span>{SAMPLE_PRIORITIES[activePriority].rounds}</span>
                </div>
              </motion.div>
            </div>

            <div className={styles.reportCta}>
              <p>This is your data. See what VANTAGE finds in your matches.</p>
              <form onSubmit={handleAnalyze} className={styles.reportCtaForm}>
                <input
                  className={styles.riotInputSm}
                  type="text"
                  placeholder="YourName#TAG"
                  value={riotId}
                  onChange={e => { setRiotId(e.target.value); setError('') }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className={styles.ctaSm} type="submit">Analyze</button>
              </form>
            </div>
          </div>
        </FadeUp>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <FadeUp>
            <h2 className={styles.finalHeadline}>
              Start your next session<br /><span>knowing what to fix.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <form className={styles.inputRow} onSubmit={handleAnalyze}>
              <div className={styles.inputWrap}>
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
              </div>
              <button className={styles.cta} type="submit">
                Analyze my matches
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {error && <p className={styles.inputError}>{error}</p>}
            </form>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className={styles.inputNote}>Free to use · Public profile required · No installs</p>
          </FadeUp>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <VantageLogo size={18} />
          <span className={styles.wordmark}>VANTAGE</span>
        </div>
        <span className={styles.footerNote}>Not affiliated with Riot Games, Inc.</span>
      </footer>
    </div>
  )
}
