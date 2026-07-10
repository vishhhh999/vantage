import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './DecisionFeed.module.css'

const FEED = [
  { tag: 'ECONOMY', tone: 'warn', text: 'Full-buy called into a lost eco round — 3rd time this session.' },
  { tag: 'ENTRY', tone: 'accent', text: 'First death, no info called, 14s into the round.' },
  { tag: 'UTILITY', tone: 'cyan', text: 'Smoke landed 2s late for the site execute.' },
  { tag: 'ROTATE', tone: 'accent', text: 'Rotation started 4s after enemy commit — site lost.' },
  { tag: 'TRADE', tone: 'success', text: 'Trade converted in 1.8s — clean.' },
  { tag: 'CLUTCH', tone: 'cyan', text: '1v2 conversion — post-plant hold paid off.' },
  { tag: 'ECONOMY', tone: 'success', text: 'Force-buy read correctly after opponent eco loss.' },
  { tag: 'DUEL', tone: 'warn', text: 'Operator picked into an unfavorable duel range.' },
]

export default function DecisionFeed() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const loop = [...FEED, ...FEED]

  return (
    <div className={styles.wrap} ref={ref}>
      <div className={styles.fadeTop} />
      <motion.div
        className={styles.track}
        animate={inView ? { y: [0, -FEED.length * 52] } : {}}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      >
        {loop.map((f, i) => (
          <div className={styles.row} key={i}>
            <span className={styles.tag} data-tone={f.tone}>{f.tag}</span>
            <span className={styles.text}>{f.text}</span>
          </div>
        ))}
      </motion.div>
      <div className={styles.fadeBottom} />
    </div>
  )
}
