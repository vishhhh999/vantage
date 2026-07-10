import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './SignalConsole.module.css'

// The 12 decision-error categories referenced elsewhere on the page (the
// "12 decision categories" stat). Values are illustrative — this is a
// closing visual, not a live readout — but the category list itself is
// real, matching the actual scoring framework so nothing here is invented.
const CATEGORIES = [
  { label: 'Economy', v: 78, flagged: true },
  { label: 'Rotation', v: 42 },
  { label: 'Role discipline', v: 61 },
  { label: 'Util timing', v: 35 },
  { label: 'Map patterns', v: 54 },
  { label: 'Clutch reads', v: 29 },
  { label: 'Entry timing', v: 71, flagged: true },
  { label: 'Trade windows', v: 48 },
  { label: 'Site retake', v: 33 },
  { label: 'Crosshair drift', v: 22 },
  { label: 'Session decay', v: 65, flagged: true },
  { label: 'Comms recovery', v: 40 },
]

function CountUp({ to, duration = 1.1, active }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf, start
    function tick(ts) {
      if (!start) start = ts
      const t = Math.min(1, (ts - start) / (duration * 1000))
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, to, duration])
  return <span className="v-num">{n}</span>
}

export default function SignalConsole() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div className={`${styles.panel} v-cut-lg`} ref={ref}>
      <div className={styles.panelHeader}>
        <span className={styles.panelLabel}>Session scan</span>
        <span className={styles.panelStatus} data-live={inView}>
          <span className={styles.statusDot} />
          {inView ? 'Complete' : 'Standby'}
        </span>
      </div>

      <div className={styles.bars}>
        {CATEGORIES.map((c, i) => (
          <div className={styles.barRow} key={c.label}>
            <span className={styles.barLabel}>{c.label}</span>
            <div className={styles.barTrack}>
              <motion.div
                className={styles.barFill}
                data-flagged={c.flagged || undefined}
                initial={{ width: 0 }}
                animate={inView ? { width: `${c.v}%` } : {}}
                transition={{ duration: 0.6, delay: 0.08 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panelFooter}>
        <div className={styles.readout}>
          <span className={styles.readoutNum}><CountUp to={20} active={inView} /></span>
          <span className={styles.readoutLabel}>Matches read</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutNum}><CountUp to={12} active={inView} /></span>
          <span className={styles.readoutLabel}>Categories scored</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutNum} data-accent="true"><CountUp to={3} active={inView} /></span>
          <span className={styles.readoutLabel}>Flagged as priority</span>
        </div>
      </div>
    </div>
  )
}
