import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import ProcessFlow from '../components/ProcessFlow'
import DecisionFeed from '../components/DecisionFeed'
import styles from './Process.module.css'

function VantageLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 30,28 2,28" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="16,10 24,26 8,26" fill="#FF4655" fillOpacity="0.1" stroke="#FF4655" strokeWidth="1" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="28" stroke="#FF4655" strokeWidth="1" strokeOpacity="0.25"/>
    </svg>
  )
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

const CATEGORIES = [
  'Economy discipline', 'Rotation logic', 'Role & agent fit', 'Utility timing',
  'Map-specific patterns', 'Clutch conversion', 'Entry timing', 'Trade windows',
  'Site retake structure', 'Crosshair placement', 'Session degradation', 'Comms recovery',
]

const FAQ = [
  {
    q: 'Is this affiliated with Riot Games?',
    a: 'No. VANTAGE is an independent tool built on Riot\'s official public API. It\'s not endorsed by, sponsored by, or affiliated with Riot Games in any way — same as any third-party stats site.',
  },
  {
    q: 'How is this different from Tracker.gg or similar sites?',
    a: 'Those tools are built to show you everything — every stat, every match, sortable every way. That\'s useful for lookup, but it puts the work of finding a pattern on you. VANTAGE inverts that: it does the pattern-finding first and only surfaces the handful of things actually worth changing.',
  },
  {
    q: 'Do you store my match data forever?',
    a: 'Reports are stored so you can track your history over time, tied to your account with row-level access — only you can read your own data. You can request full deletion at any time (see the privacy policy).',
  },
  {
    q: 'Can VANTAGE see my Riot password?',
    a: 'No. Sign-in happens entirely on Riot\'s own login page. VANTAGE receives a token proving you signed in — never your credentials.',
  },
  {
    q: 'Why only the last 20 matches?',
    a: 'It\'s a large enough sample to separate real patterns from one bad game, without diluting recent form with matches from a different patch, rank, or role you\'ve since moved past.',
  },
]

const PRINCIPLES = [
  {
    title: 'Official data only',
    body: 'Every match comes from Riot\'s own competitive API, through their own sign-in flow. No scraping, no third-party stat mirrors, no unofficial endpoints. If Riot doesn\'t expose it, VANTAGE doesn\'t have it.',
  },
  {
    title: 'You authorize every read',
    body: 'Match history is gated behind your own Riot sign-in — the same account, the same consent screen. VANTAGE can only ever see what you\'ve explicitly signed in to share.',
  },
  {
    title: 'The scoring is explainable',
    body: 'Every finding traces back to a specific number: a winrate split, a round timestamp, an economy pattern. If a claim can\'t be tied to your own match data, it doesn\'t make it into your report.',
  },
  {
    title: 'Built by one player, for players like him',
    body: 'VANTAGE isn\'t a stats company. It\'s a tool built by someone who plays ranked and got tired of VOD review without structure — and it\'s built in the open, with the roadmap shaped by what actually helps.',
  },
]

export default function Process() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.navBrand}>
          <VantageLogo size={22} />
          <span className={styles.wordmark}>VANTAGE</span>
        </Link>
        <Link to="/login" className={styles.navLogin}>Sign in</Link>
      </nav>

      <section className={styles.hero}>
        <Reveal>
          <p className={styles.eyebrow}><span className={styles.eyebrowDot} />The process</p>
          <h1 className={styles.headline}>How VANTAGE turns<br /><span>a match into a lesson.</span></h1>
          <p className={styles.heroSub}>
            Most tools stop at showing you a scoreboard. This is the full path from your Riot ID
            to a coaching report — what we read, how we score it, and where a Claude-based model tuned
            specifically for VALORANT's decision-error taxonomy fits into the pipeline.
          </p>
        </Reveal>
      </section>

      <section className={styles.flowSection}>
        <Reveal>
          <ProcessFlow />
        </Reveal>
      </section>

      <section className={styles.detailSection}>
        <Reveal>
          <div className={styles.detailBlock}>
            <span className={styles.detailNum}>01</span>
            <div>
              <h2 className={styles.detailTitle}>Intake — your last 20 competitive matches</h2>
              <p className={styles.detailBody}>
                You sign in with Riot directly — VANTAGE never sees or stores your password, and never asks
                for one. That sign-in is what unlocks read access to your own match history through Riot's
                official competitive API. We pull your last 20 ranked matches: no more, no less, refreshed
                on a cooldown so the pull stays respectful of Riot's rate limits.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className={styles.detailBlock}>
            <span className={styles.detailNum}>02</span>
            <div>
              <h2 className={styles.detailTitle}>Analysis — twelve decision-error categories</h2>
              <p className={styles.detailBody}>
                Every match gets parsed round-by-round against a fixed scoring framework: economy discipline,
                rotation logic, role and agent fit, utility timing, map-specific patterns, clutch conversion,
                and more. This step is deterministic — it's the same math every time, not a model guessing.
                It's what decides which three issues are actually worth your attention this session.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.16}>
          <div className={styles.detailBlock}>
            <span className={styles.detailNum}>03</span>
            <div>
              <h2 className={styles.detailTitle}>Coaching — turning scores into language</h2>
              <p className={styles.detailBody}>
                The top three scored issues, along with the specific numbers behind them, go to a Claude-based
                model tuned specifically for VALORANT's decision-error taxonomy. Its only job is to turn a
                scored pattern into a specific, direct coaching note — grounded in your numbers, not generic
                advice. If the data doesn't support a claim, the model isn't given room to make one.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className={styles.categorySection}>
        <Reveal>
          <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />The scoring framework</p>
          <h2 className={styles.sectionHeadline}>Twelve categories.<br /><span>Every match, every time.</span></h2>
        </Reveal>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((c, i) => (
            <Reveal key={c} delay={i * 0.04}>
              <div className={styles.categoryChip}>
                <span className={styles.categoryNum}>{String(i + 1).padStart(2, '0')}</span>
                {c}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.feedSection}>
        <Reveal>
          <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />What it catches</p>
          <h2 className={styles.sectionHeadline}>A sample of the kind<br /><span>of thing that gets flagged.</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <DecisionFeed />
        </Reveal>
      </section>

      <section className={styles.faqSection}>
        <Reveal>
          <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />Questions</p>
          <h2 className={styles.sectionHeadline}>Before you sign in.</h2>
        </Reveal>
        <div className={styles.faqList}>
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.06}>
              <div className={styles.faqItem}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.principlesSection}>
        <Reveal>
          <p className={styles.sectionEyebrow}><span className={styles.eyebrowDot} />Why it's built this way</p>
          <h2 className={styles.sectionHeadline}>Rules we don't break.</h2>
        </Reveal>
        <div className={styles.principlesGrid}>
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className={styles.principle}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <Reveal>
          <h2 className={styles.ctaHeadline}>See it run on your own matches.</h2>
          <Link to="/login" className={styles.ctaBtn}>Sign in to analyze</Link>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <VantageLogo size={16} />
          <span className={styles.wordmark}>VANTAGE</span>
        </div>
        <nav className={styles.footerLinks}>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of service</Link>
        </nav>
        <span className={styles.footerNote}>Not affiliated with Riot Games, Inc.</span>
      </footer>
    </div>
  )
}
