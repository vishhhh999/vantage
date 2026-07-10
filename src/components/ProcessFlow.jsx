import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './ProcessFlow.module.css'

// Three abstracted phases of the pipeline — deliberately described in
// outcome-level keywords (what happens), never implementation-level ones
// (what it's built on). "Match API" / "Claude" / "Supabase" never appear
// here; that's an internal architecture detail, not a marketing one.
const PHASES = [
  {
    id: '01',
    title: 'Intake',
    tags: ['Riot ID', 'Region', 'Last 20 matches'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 6L40 15V33L24 42L8 33V15L24 6Z" stroke="#FF4655" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M24 6V24M24 24L40 15M24 24L8 15" stroke="#FF4655" strokeWidth="1" strokeOpacity="0.4"/>
        <circle cx="24" cy="24" r="3" fill="#FF4655"/>
      </svg>
    ),
  },
  {
    id: '02',
    title: 'Analysis',
    tags: ['Round-level parsing', 'Decision scoring', 'Pattern detection'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="15" stroke="#3E4753" strokeWidth="1.4"/>
        <path d="M24 9v6M24 33v6M9 24h6M33 24h6" stroke="#FF4655" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="24" cy="24" r="5.5" fill="rgba(255,70,85,0.08)" stroke="#FF4655" strokeWidth="1.4"/>
        <circle cx="24" cy="24" r="1.6" fill="#FF4655"/>
      </svg>
    ),
  },
  {
    id: '03',
    title: 'Coaching',
    tags: ['Priority ranking', 'Specific fixes', 'Session report'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M10 14h28M10 22h20M10 30h14" stroke="#3E4753" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M10 14h20" stroke="#FF4655" strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="30" y="26" width="14" height="14" stroke="#FF4655" strokeWidth="1.4" transform="rotate(0 30 26)"/>
        <path d="M34 33l2.2 2.2L41 30.5" stroke="#FF4655" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function ProcessFlow() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div className={styles.flow} ref={ref}>
      {PHASES.map((phase, i) => (
        <div className={styles.phaseWrap} key={phase.id}>
          <motion.div
            className={`${styles.phase} v-cut-md`}
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.phaseId}>{phase.id}</span>
            <div className={styles.phaseIcon}>{phase.icon}</div>
            <h4 className={styles.phaseTitle}>{phase.title}</h4>
            <div className={styles.phaseTags}>
              {phase.tags.map(t => (
                <span className={styles.phaseTag} key={t}>{t}</span>
              ))}
            </div>
          </motion.div>

          {i < PHASES.length - 1 && (
            <div className={styles.connector}>
              <motion.div
                className={styles.connectorLine}
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 + 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className={styles.connectorPulse} style={{ animationDelay: `${i * 0.4}s` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
