import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './TacticalMinimap.module.css'

// Abstract, non-Riot map layout (generic two-site geometry, not a real
// VALORANT map) — this is a marketing visual demonstrating the kind of
// positional read VANTAGE teaches, not a reproduction of any specific map.
const TEAM = [
  { x: 90, y: 260 }, { x: 130, y: 230 }, { x: 70, y: 210 }, { x: 150, y: 290 },
]
const YOU = { x: 190, y: 175 }
const ENEMY = [
  { x: 330, y: 90 }, { x: 300, y: 130 }, { x: 250, y: 70 },
]

const CALLOUTS = [
  { x: 190, y: 175, text: 'Held angle 8s past the plant window', tone: 'flag' },
  { x: 300, y: 130, text: 'Enemy rotation missed — no info called', tone: 'info' },
]

const INSIGHTS = [
  'Rotation call came 4 seconds after the enemy had already committed to the site.',
  'A trade window was open for 2.5s after the first pick — no follow-up.',
  'Utility was used pre-emptively, before any confirmed enemy read.',
]

export default function TacticalMinimap() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [activeCallout, setActiveCallout] = useState(null)

  return (
    <div className={`${styles.panel} v-cut-lg`} ref={ref}>
      <div className={styles.panelHeader}>
        <span className={styles.panelLabel}>Round replay — post-plant B</span>
        <span className={styles.panelBadge}>Sample</span>
      </div>

      <div className={styles.mapWrap}>
        <svg viewBox="0 0 400 320" className={styles.mapSvg}>
          {/* abstract layout: corridors + two sites */}
          <rect x="20" y="20" width="360" height="280" fill="none" stroke="#2A3440" strokeWidth="1" />
          <circle cx="90" cy="80" r="34" fill="none" stroke="#2A3440" strokeWidth="1" />
          <text x="90" y="84" textAnchor="middle" fontSize="13" fill="#4C5559" fontFamily="Bebas Neue">A</text>
          <circle cx="300" cy="240" r="34" fill="none" stroke="#2A3440" strokeWidth="1" />
          <text x="300" y="244" textAnchor="middle" fontSize="13" fill="#4C5559" fontFamily="Bebas Neue">B</text>
          <path d="M90 114 L90 175 L190 175" stroke="#2A3440" strokeWidth="1" fill="none" />
          <path d="M300 206 L250 130 L90 80" stroke="#2A3440" strokeWidth="1" fill="none" />
          <path d="M190 175 L300 206" stroke="#2A3440" strokeWidth="1" fill="none" />

          {/* spike marker */}
          <motion.g initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}>
            <rect x="292" y="228" width="16" height="16" fill="none" stroke="var(--warning)" strokeWidth="1.4" transform="rotate(45 300 236)" />
          </motion.g>

          {/* team blips */}
          {TEAM.map((p, i) => (
            <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="#5CE1E6"
              initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 0.8, scale: 1 } : {}}
              transition={{ delay: 0.4 + i * 0.05 }} />
          ))}
          {/* enemy blips */}
          {ENEMY.map((p, i) => (
            <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="#FF4655"
              initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 0.8, scale: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.05 }} />
          ))}
          {/* you */}
          <motion.g initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.6 }}
            style={{ transformOrigin: `${YOU.x}px ${YOU.y}px` }}>
            <circle cx={YOU.x} cy={YOU.y} r="7" fill="none" stroke="#ECE8E1" strokeWidth="1.4" />
            <circle cx={YOU.x} cy={YOU.y} r="2.5" fill="#ECE8E1" />
          </motion.g>

          {/* callout hotspots */}
          {CALLOUTS.map((c, i) => (
            <motion.circle key={i} cx={c.x} cy={c.y} r="14" fill="transparent"
              stroke={c.tone === 'flag' ? '#FF4655' : '#5CE1E6'} strokeWidth="1"
              strokeDasharray="3 3" style={{ cursor: 'pointer' }}
              initial={{ opacity: 0 }} animate={inView ? { opacity: 0.7 } : {}}
              transition={{ delay: 0.8 + i * 0.1 }}
              onMouseEnter={() => setActiveCallout(i)}
              onMouseLeave={() => setActiveCallout(null)}
            />
          ))}
        </svg>

        {activeCallout !== null && (
          <div
            className={styles.calloutTip}
            data-tone={CALLOUTS[activeCallout].tone}
            style={{
              left: `${(CALLOUTS[activeCallout].x / 400) * 100}%`,
              top: `${(CALLOUTS[activeCallout].y / 320) * 100}%`,
            }}
          >
            {CALLOUTS[activeCallout].text}
          </div>
        )}
      </div>

      <div className={styles.insightPanel}>
        <span className={styles.insightLabel}>What the data shows</span>
        <ul className={styles.insightList}>
          {INSIGHTS.map((t, i) => (
            <motion.li key={i}
              initial={{ opacity: 0, x: -8 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.12 }}>
              {t}
            </motion.li>
          ))}
        </ul>
        <p className={styles.insightFootnote}>
          This is what round-level analysis looks like — not just what happened, but the exact moment the round tipped.
        </p>
      </div>
    </div>
  )
}
