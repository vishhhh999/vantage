import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './ComparisonPanel.module.css'

const ROWS = [
  { label: 'Shows your K/D and ADR', them: true, us: true },
  { label: 'Tells you why a specific round was lost', them: false, us: true },
  { label: 'Ranks issues by how many rounds they cost', them: false, us: true },
  { label: 'Gives one concrete fix per session, not a wall of stats', them: false, us: true },
  { label: 'Requires you to interpret the numbers yourself', them: true, us: false },
]

export default function ComparisonPanel() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div className={styles.panel} ref={ref}>
      <div className={styles.colHeader}>
        <span className={styles.colHeaderLabel} data-tone="dim">Stat trackers</span>
        <span className={styles.colHeaderLabel} data-tone="accent">VANTAGE</span>
      </div>
      {ROWS.map((r, i) => (
        <motion.div className={styles.row} key={r.label}
          initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.08 }}>
          <span className={styles.mark} data-yes={r.them}>{r.them ? '✓' : '—'}</span>
          <span className={styles.rowLabel}>{r.label}</span>
          <span className={styles.mark} data-yes={r.us} data-accent="true">{r.us ? '✓' : '—'}</span>
        </motion.div>
      ))}
    </div>
  )
}
