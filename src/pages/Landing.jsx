import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import ProcessFlow from '../components/ProcessFlow'
import SignalConsole from '../components/SignalConsole'
import { agentIconPath, mapImagePath, rankBadgePath } from '../lib/assets'
import styles from './Landing.module.css'

const REGIONS = [
  { value: 'ap', label: 'AP — SEA / OCE' },
  { value: 'na', label: 'NA' },
  { value: 'eu', label: 'EU' },
  { value: 'kr', label: 'KR' },
]

// Three sample profiles so the landing page can show the actual range of
// what a report looks like at different skill levels, not just one fixed
// example. No player identity is shown on any of them — rank, agent, and
// region only, matching what the real product surfaces before sign-in.
const SAMPLE_REPORTS = [
  {
    id: 'climber',
    tabLabel: 'Platinum climber',
    rankSlug: 'platinum-1', rankName: 'Platinum 1',
    agentSlug: 'raze', region: 'AP', matches: 20,
    stats: [['48.9%', 'Win rate'], ['1.18', 'K/D'], ['158.6', 'ADR'], ['17.3%', 'HS%']],
    summary: "Your ceiling is clearly Immortal — the data proves it. Your floor is what's keeping you in Platinum. Three patterns are responsible for the gap. Fix these in order.",
    priorities: [
      {
        rank: 1, severity: 'critical', impact: 82,
        label: 'Agent-role mismatch', stat: '45.3% WR on main',
        finding: "You've played Raze in 53 of your last 139 matches with a 45.3% winrate. Your Jett winrate is 65.2% over 23 matches — a 20-point gap. You're defaulting to the wrong agent every session based on habit, not data.",
        fix: 'Make Jett your primary. The winrate gap is too large to ignore. Raze is situational — maps with long sightlines where her blast pack creates genuine angles.',
        rounds: 'Costs est. 4–6 rounds per session', mapSlug: null,
      },
      {
        rank: 2, severity: 'high', impact: 61,
        label: 'Map-specific breakdown', stat: '31.6% WR on Corrode',
        finding: "Corrode: 31.6% (6W–12L). Bind: 42.9% (9W–12L). Haven: 75% (15W–5L). Your read on 3-site maps is strong. Your rotation logic breaks on maps with tight corridors — you're playing the same tempo regardless of map geometry.",
        fix: "On Corrode and Bind, slow your default tempo by one beat. These maps punish commitment — read before pushing, don't push to read.",
        rounds: 'Costs est. 3–5 rounds per session', mapSlug: 'corrode',
      },
      {
        rank: 3, severity: 'high', impact: 74,
        label: 'Session degradation', stat: 'K/D drops 0.4 after match 6',
        finding: 'You played 10 matches on March 11. Your DDΔ that day was nearly neutral despite 5 wins. Your best single match was 2.1 K/D. Your worst was 0.5 K/D. Same player, same week. Your floor is costing you more than your ceiling gains.',
        fix: "Hard cap: 5 matches per session. If you go 2 consecutive losses with negative DDΔ — stop. The data shows you don't recover within the same session.",
        rounds: 'Costs est. 5–8 rounds per session', mapSlug: null,
      },
    ],
  },
  {
    id: 'grinder',
    tabLabel: 'Immortal grinder',
    rankSlug: 'immortal-2', rankName: 'Immortal 2',
    agentSlug: 'omen', region: 'NA', matches: 20,
    stats: [['54.2%', 'Win rate'], ['1.34', 'K/D'], ['171.9', 'ADR'], ['24.1%', 'HS%']],
    summary: "Your mechanics are Radiant-adjacent. Your utility usage is not. You're winning duels and still losing rounds — the gap isn't aim, it's timing.",
    priorities: [
      {
        rank: 1, severity: 'critical', impact: 76,
        label: 'Utility underutilization', stat: '1.1 casts/round on main',
        finding: "On Omen, you average 1.1 ability casts per round across your last 20 matches — teammates on the same agent in your rank bracket average 2.3. Your smokes land, but you're not using flashes or the TP to create the second angle that converts your entries.",
        fix: "Force a minimum 2-cast round on your next 5 sessions. Track it. The blind-into-entry sequence is what's missing, not the entry itself.",
        rounds: 'Costs est. 4–7 rounds per session', mapSlug: null,
      },
      {
        rank: 2, severity: 'high', impact: 58,
        label: 'Trade timing', stat: "Traded within 3s only 41% of the time",
        finding: "When you die first in a round, a teammate converts the trade within 3 seconds only 41% of the time — well below your rank average of ~58%. You're taking duels slightly ahead of your team's positioning, not behind it.",
        fix: 'Hold your entry by one full rotation cycle when a teammate is more than 2 seconds behind you on comms. The duel is fine — the timing around it isn\'t.',
        rounds: 'Costs est. 3–5 rounds per session', mapSlug: null,
      },
      {
        rank: 3, severity: 'medium', impact: 49,
        label: 'Map-specific breakdown', stat: '38.9% WR on Lotus',
        finding: 'Lotus: 38.9% (7W–11L) vs your season average of 54.2%. Three-site maps with rotating doors are consistently your worst category — your controller placement assumes static sightlines that Lotus doesn\'t have.',
        fix: 'On Lotus specifically, delay smoke commits until the door state is confirmed. Same principle, map-specific execution.',
        rounds: 'Costs est. 2–4 rounds per session', mapSlug: 'lotus',
      },
    ],
  },
  {
    id: 'peak',
    tabLabel: 'Radiant peak',
    rankSlug: 'radiant', rankName: 'Radiant',
    agentSlug: 'jett', region: 'KR', matches: 20,
    stats: [['61.8%', 'Win rate'], ['1.52', 'K/D'], ['189.4', 'ADR'], ['31.6%', 'HS%']],
    summary: "There's no obvious mechanical or macro leak here — which means the remaining rounds are in the margins. One pattern is costing you close games specifically.",
    priorities: [
      {
        rank: 1, severity: 'high', impact: 55,
        label: 'Economy discipline', stat: 'Full-buy into 34% of eco losses',
        finding: "In rounds your team lost the previous economy round, you full-bought anyway 34% of the time this session — well above the 12% rate in your wins. It's a small leak, but at your rank, small leaks are the only leaks left.",
        fix: "Default to a force-buy read, not a full-buy, the round after any eco loss unless a teammate confirms enemy is also broke. This is a team-econ discipline fix, not an individual one — flag it to your stack.",
        rounds: 'Costs est. 2–3 rounds per session', mapSlug: null,
      },
      {
        rank: 2, severity: 'medium', impact: 47,
        label: 'Premade vs. solo split', stat: '58% WR solo vs. 66% WR in stack',
        finding: "Your win rate drops 8 points when queuing solo vs. with a premade, concentrated specifically on maps requiring coordinated info trades (Bind, Split). Your individual output doesn't change — the coordination layer does.",
        fix: 'On solo queue, default to a more self-sufficient agent pool for the first 2 rounds until you have a read on your team\'s comms level.',
        rounds: 'Costs est. 2–4 rounds per session', mapSlug: 'split',
      },
      {
        rank: 3, severity: 'medium', impact: 44,
        label: 'First-death rate', stat: 'First death in 29% of rounds',
        finding: "You're the first death in 29% of rounds this session — not high in absolute terms, but concentrated almost entirely in post-plant scenarios rather than entries, which is a different (and more costly) pattern than it looks like on the surface.",
        fix: 'Post-plant positioning review: you\'re holding pre-plant angles after the plant instead of rotating to trade-friendly positions. Small habit, disproportionate cost at this rank.',
        rounds: 'Costs est. 2–3 rounds per session', mapSlug: null,
      },
    ],
  },
]

// The 8 deeper-analysis categories going into the next patch (see the
// project roadmap) — surfaced here as a preview strip so the sample report
// communicates where the product is headed, not just what's live today.
const DEPTH_SIGNALS = [
  'First-death rate', 'Economy discipline', 'Trade timing', 'Weapon duels',
  'Positional replay', 'Premade split', 'Utility usage', 'Team-play score',
]

function VantageLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 30,28 2,28" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="16,10 24,26 8,26" fill="#FF4655" fillOpacity="0.1" stroke="#FF4655" strokeWidth="1" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="28" stroke="#FF4655" strokeWidth="1" strokeOpacity="0.25"/>
    </svg>
  )
}

function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, particles = [], mouse = { x: -9999, y: -9999 }
    let width = 0, height = 0

    function resize() {
      const dpr = window.devicePixelRatio || 1
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function init() {
      particles = []
      const count = Math.floor((width * height) / 5500)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.4 + 0.5,
          opacity: Math.random() * 0.35 + 0.15,
        })
      }
    }
    function draw() {
      ctx.clearRect(0, 0, width, height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
        const dx = mouse.x - p.x, dy = mouse.y - p.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        const glow = dist < 180 ? (1 - dist/180) * 0.9 : 0
        const pulseSize = dist < 180 ? p.size + (1 - dist/180) * 1.8 : p.size
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulseSize, 0, Math.PI*2)
        const particleColor = glow > 0.05 ? '255,70,85' : '236,232,225'
        ctx.fillStyle = `rgba(${particleColor},${Math.min(1, p.opacity + glow)})`
        ctx.fill()
      })
      particles.forEach((a, i) => {
        for (let j = i+1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(78,90,102,${0.12*(1-d/110)})`
            ctx.lineWidth = 0.6; ctx.stroke()
          }
        }
      })
      if (mouse.x > -900) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(78,90,102,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      animId = requestAnimationFrame(draw)
    }
    function onMouse(e) {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top
    }
    function onLeave() {
      mouse.x = -9999; mouse.y = -9999
    }

    let resizeTimer
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => { resize(); init() }, 120)
    }

    resize(); init(); draw()
    window.addEventListener('resize', onResize)
    canvas.addEventListener('mousemove', onMouse)
    canvas.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(animId)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMouse)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])
  return <canvas ref={canvasRef} className={styles.particleCanvas} />
}

function FadeUp({ children, delay = 0, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

export default function Landing() {
  const [riotId, setRiotId] = useState('')
  const [region, setRegion] = useState('ap')
  const [error, setError] = useState('')
  const [activeReport, setActiveReport] = useState(0)
  const [activePriority, setActivePriority] = useState(0)
  const currentReport = SAMPLE_REPORTS[activeReport]

  function selectReport(i) {
    setActiveReport(i)
    setActivePriority(0)
  }
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactSent, setContactSent] = useState(false)
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, -60])
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0])

  function handleAnalyze(e) {
    e.preventDefault()
    // Riot requires players to authenticate via RSO before we can read their
    // match history — an arbitrary typed Riot ID can no longer be analyzed
    // anonymously. Route into sign-in; the real Riot ID gets confirmed there
    // via Riot's own login, not from this field.
    navigate('/login')
  }

  function handleContactSubmit(e) {
    e.preventDefault()
    const { name, email, subject, message } = contactForm
    const body = `From: ${name} (${email})\n\n${message}`
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=visheshmahendru11@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setContactSent(true)
    window.open(gmailUrl, '_blank', 'noopener,noreferrer')
    setTimeout(() => setContactSent(false), 4000)
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
          <a href="/process">Process</a>
        </div>
        <a href="/login" className={styles.navLogin}>Sign in</a>
      </nav>

      <section className={styles.hero}>
        <ParticleField />
        <motion.div className={styles.heroCenter} style={{ y: heroY, opacity: heroOpacity }}>
          <motion.p className={styles.eyebrow}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <span className={styles.eyebrowDot} />
            Round-level decision analysis
          </motion.p>
          <motion.h1 className={styles.headline}
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <span className={styles.hl1}>Find out what's</span>
            <span className={styles.hl2}>actually costing</span>
            <span className={styles.hl3}>you rounds.</span>
          </motion.h1>
          <motion.p className={styles.heroSub}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.42 }}>
            VANTAGE reads your last 20 competitive matches and tells you which decisions are losing you games — and what to change.
          </motion.p>
          <motion.form className={styles.inputGroup} onSubmit={handleAnalyze}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}>
            <div className={styles.inputFields}>
              <input className={styles.riotInput} type="text" placeholder="YourName#TAG"
                value={riotId} onChange={e => { setRiotId(e.target.value); setError('') }}
                autoComplete="off" spellCheck={false} />
              <select className={styles.regionSelect} value={region} onChange={e => setRegion(e.target.value)}>
                {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button className={styles.cta} type="submit">
              Sign in to analyze
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {error && <p className={styles.inputError}>{error}</p>}
            <p className={styles.inputNote}>Free · Sign in with Riot required · No installs</p>
          </motion.form>
        </motion.div>
      </section>

      <div className={styles.statsStrip}>
        {[
          { num: '20', label: 'Matches per analysis' },
          { num: '12', label: 'Decision categories' },
          { num: '3', label: 'Priority fixes' },
          { num: '<60s', label: 'Time to insight' },
        ].map((s, i) => (
          <FadeUp key={s.label} delay={i * 0.07}>
            <div className={styles.stripStat}>
              <span className={styles.stripNum}>{s.num}</span>
              <span className={styles.stripLabel}>{s.label}</span>
            </div>
          </FadeUp>
        ))}
      </div>

      <section className={styles.howSection} id="how">
        <div className={styles.howInner}>
          <FadeUp>
            <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />How it works</p>
            <h2 className={styles.sectionHeadline}>From Riot ID to<br /><span>coaching report.</span></h2>
          </FadeUp>
          <div className={styles.howSteps}>
            {[
              {
                num: '01', title: 'Enter your Riot ID',
                desc: 'No installs. No screen capture. Just your Riot ID and region. We pull your last 20 competitive matches directly from the official Riot API.',
                icon: <svg viewBox="0 0 56 56" fill="none"><rect x="10" y="14" width="36" height="28" rx="3" stroke="#FF4655" strokeWidth="1.5"/><path d="M19 24h18M19 30h11" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="round"/><circle cx="41" cy="14" r="7" fill="#0F1923" stroke="#FF4655" strokeWidth="1.5"/><path d="M39 14l1.5 1.5L43 12" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              },
              {
                num: '02', title: 'We score your decisions',
                desc: 'Every match is parsed across 12 error categories — economy, rotation, role discipline, util timing, map patterns, clutch reads. Not what happened. Why.',
                icon: <svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="16" stroke="#3E4753" strokeWidth="1.5"/><path d="M28 12v4M28 40v4M12 28h4M40 28h4" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="round"/><circle cx="28" cy="28" r="5" fill="rgba(255,70,85,0.1)" stroke="#FF4655" strokeWidth="1.5"/><line x1="28" y1="28" x2="35" y2="21" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="round"/><circle cx="35" cy="21" r="2" fill="#FF4655"/></svg>
              },
              {
                num: '03', title: 'Get 3 things to fix',
                desc: 'Your highest-impact errors surface as your priorities. Each one shows the specific pattern, why it costs rounds, and one concrete adjustment for next session.',
                icon: <svg viewBox="0 0 56 56" fill="none"><path d="M16 20h24M16 28h16" stroke="#3E4753" strokeWidth="1.5" strokeLinecap="round"/><path d="M16 20h24M16 28h12" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="round"/><circle cx="40" cy="38" r="8" fill="rgba(255,70,85,0.06)" stroke="#FF4655" strokeWidth="1.5"/><path d="M37 38l2 2 4-4" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              },
            ].map((s, i) => (
              <FadeUp key={s.num} delay={i * 0.1}>
                <div className={styles.howStep}>
                  <div className={styles.howStepIcon}>{s.icon}</div>
                  <div className={styles.howStepNum}>{s.num}</div>
                  <h3 className={styles.howStepTitle}>{s.title}</h3>
                  <p className={styles.howStepDesc}>{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.1}>
            <ProcessFlow />
          </FadeUp>
        </div>
      </section>

      <section className={styles.sampleSection} id="sample">
        <div className={styles.sampleInner}>
          <FadeUp>
            <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />Sample reports</p>
            <h2 className={styles.sectionHeadline}>Not stats.<br /><span>Decisions.</span></h2>
            <p className={styles.sampleDesc}>Every other tool shows you what happened. VANTAGE tells you why you lost the round — and what to change. Three sample profiles below show the range, from climbing out of mid ranks to closing margins at the top.</p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className={styles.reportTabs}>
              {SAMPLE_REPORTS.map((r, i) => (
                <button key={r.id} className={styles.reportTab} data-active={activeReport === i} onClick={() => selectReport(i)}>
                  {r.tabLabel}
                </button>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReport.id}
                className={`${styles.sampleCard} v-cut-lg`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.scHeader}>
                  <div className={styles.scLeft}>
                    <img className={styles.scRankBadge} src={rankBadgePath(currentReport.rankName)} alt={currentReport.rankName} />
                    <div className={styles.scAgentPortrait}>
                      <img src={agentIconPath(currentReport.agentSlug)} alt={currentReport.agentSlug} />
                    </div>
                    <div>
                      <p className={styles.scRankName}>{currentReport.rankName}</p>
                      <p className={styles.scMeta}>{currentReport.matches} matches · {currentReport.region}</p>
                    </div>
                  </div>
                  <div className={styles.scStats}>
                    {currentReport.stats.map(([v, l]) => (
                      <div key={l} className={styles.scStat}>
                        <span className={styles.scStatNum}>{v}</span>
                        <span className={styles.scStatLabel}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.scSummary}>
                  <span className={styles.scSummaryTag}>Coach</span>
                  <p>{currentReport.summary}</p>
                </div>

                <div className={styles.scImpactChart}>
                  <span className={styles.scImpactChartLabel}>Impact by priority</span>
                  <div className={styles.scImpactBars}>
                    {currentReport.priorities.map((p, i) => (
                      <button key={p.rank} className={styles.scImpactBarRow} onClick={() => setActivePriority(i)} data-active={activePriority === i}>
                        <span className={styles.scImpactBarLabel}>P{p.rank}</span>
                        <div className={styles.scImpactBarTrack}>
                          <motion.div
                            className={styles.scImpactBarFill}
                            data-severity={p.severity}
                            initial={{ width: 0 }}
                            animate={{ width: `${p.impact}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                        <span className={styles.scImpactBarNum}>{p.impact}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.scBody}>
                  <div className={styles.scTabs}>
                    {currentReport.priorities.map((p, i) => (
                      <button key={p.rank} className={`${styles.scTab} v-cut-sm`}
                        data-active={activePriority === i}
                        data-severity={p.severity}
                        onClick={() => setActivePriority(i)}>
                        <span className={styles.scTabDot} data-severity={p.severity} />
                        <span className={styles.scTabNum}>0{p.rank}</span>
                        <span className={styles.scTabLabel}>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div key={activePriority} className={styles.scDetail}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                      <div className={styles.scDetailTop}>
                        <span className={styles.scPriorityLabel} data-severity={currentReport.priorities[activePriority].severity}>
                          <span className={styles.scPriorityDot} />
                          Priority {currentReport.priorities[activePriority].rank}
                        </span>
                        <span className={styles.scStatBadge}>{currentReport.priorities[activePriority].stat}</span>
                      </div>
                      <h3 className={styles.scDetailTitle}>{currentReport.priorities[activePriority].label}</h3>
                      {currentReport.priorities[activePriority].mapSlug && (
                        <div className={styles.scMapStrip}>
                          <img src={mapImagePath(currentReport.priorities[activePriority].mapSlug)} alt={currentReport.priorities[activePriority].mapSlug} />
                          <span className={styles.scMapLabel}>{currentReport.priorities[activePriority].mapSlug}</span>
                        </div>
                      )}
                      <p className={styles.scDetailFinding}>{currentReport.priorities[activePriority].finding}</p>
                      <div className={`${styles.scFix} v-cut-sm`}>
                        <span className={styles.scFixTag}>Fix</span>
                        <p>{currentReport.priorities[activePriority].fix}</p>
                      </div>
                      <div className={styles.scImpact}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="5" stroke="#F5A623" strokeWidth="1"/>
                          <path d="M6 3.5v3M6 8v.5" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {currentReport.priorities[activePriority].rounds}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className={styles.scDepthStrip}>
                  <span className={styles.scDepthLabel}>Coming next patch</span>
                  <div className={styles.scDepthChips}>
                    {DEPTH_SIGNALS.map(sig => (
                      <span key={sig} className={styles.scDepthChip}>{sig}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.scCta}>
                  <p>This is sample analysis. Login to get your own analysis done.</p>
                  <button className={`${styles.scCtaBtn} v-cut-sm`} onClick={handleAnalyze}>Sign in to analyze</button>
                </div>
              </motion.div>
            </AnimatePresence>
          </FadeUp>
        </div>
      </section>

      <section className={styles.contactSection} id="contact">
        <div className={styles.contactLeft}>
          <FadeUp>
            <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />Get in touch</p>
            <h2 className={styles.finalHeadline}>
              Questions, feedback,<br /><span>or partnership ideas.</span>
            </h2>
            <p className={styles.contactDesc}>
              VANTAGE is early. If something's broken, confusing, or you want to talk about coaching data, reach out directly.
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <form className={styles.contactForm} onSubmit={handleContactSubmit}>
              <div className={styles.contactRow}>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Name</label>
                  <input
                    className={styles.contactInput}
                    type="text"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Email</label>
                  <input
                    className={styles.contactInput}
                    type="email"
                    placeholder="you@example.com"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Subject</label>
                <input
                  className={styles.contactInput}
                  type="text"
                  placeholder="What's this about?"
                  value={contactForm.subject}
                  onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Message</label>
                <textarea
                  className={styles.contactTextarea}
                  placeholder="Tell me what's up"
                  rows={4}
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  required
                />
              </div>
              <button className={styles.cta} type="submit">
                {contactSent ? 'Opening Gmail...' : 'Send message'}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7h9M7.5 3.5L11 7l-7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </FadeUp>
        </div>
        <motion.div
          className={styles.finalCtaRight}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <SignalConsole />
        </motion.div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <VantageLogo size={16} />
          <span className={styles.wordmark}>VANTAGE</span>
        </div>
        <nav className={styles.footerLinks}>
          <a href="/process">Process</a>
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">Terms of service</a>
        </nav>
        <div className={styles.footerRight}>
          <span className={styles.betaBadge}>v2-beta</span>
          <span className={styles.footerNote}>Not affiliated with Riot Games, Inc.</span>
        </div>
      </footer>
    </div>
  )
}
