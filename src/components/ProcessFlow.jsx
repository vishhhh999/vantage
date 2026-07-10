import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './ProcessFlow.module.css'

const PHASES = [
  { id: '01', title: 'Intake', tags: ['Riot ID', 'Region', 'Last 20 matches'] },
  { id: '02', title: 'Analysis', tags: ['Round-level parsing', 'Decision scoring', 'Pattern detection'] },
  { id: '03', title: 'Coaching', tags: ['Priority ranking', 'Specific fixes', 'Session report'] },
]

// Node x-positions along the 0-1000 viewBox track - three evenly spaced
// lock points the scan travels between.
const NODE_X = [140, 500, 860]
const TRACK_Y = 70

export default function ProcessFlow() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div className={styles.flow} ref={ref}>
      <svg className={styles.track} viewBox="0 0 1000 140" preserveAspectRatio="none">
        <line x1={NODE_X[0]} y1={TRACK_Y} x2={NODE_X[2]} y2={TRACK_Y} stroke="#2A3440" strokeWidth="1.5" />
        <motion.line
          x1={NODE_X[0]} y1={TRACK_Y} x2={NODE_X[2]} y2={TRACK_Y}
          stroke="#FF4655" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        {inView && (
          <motion.circle
            r="4" fill="#FF4655"
            initial={{ cx: NODE_X[0], cy: TRACK_Y, opacity: 0 }}
            animate={{ cx: [NODE_X[0], NODE_X[1], NODE_X[2], NODE_X[2]], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.2, times: [0, 0.45, 0.9, 1], repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 5px rgba(255,70,85,0.9))' }}
          />
        )}

        {NODE_X.map((x, i) => (
          <g key={i}>
            <motion.circle
              cx={x} cy={TRACK_Y} r="26" fill="none" stroke="#3E4753" strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.22 }}
              style={{ transformOrigin: `${x}px ${TRACK_Y}px` }}
            />
            <motion.circle
              cx={x} cy={TRACK_Y} r="18" fill="none" stroke="#FF4655" strokeWidth="1.2" strokeDasharray="6 5"
              initial={{ rotate: 0, opacity: 0 }}
              animate={inView ? { rotate: 360, opacity: 0.85 } : {}}
              transition={{ opacity: { duration: 0.4, delay: 0.3 + i * 0.22 }, rotate: { duration: 14, repeat: Infinity, ease: 'linear' } }}
              style={{ transformOrigin: `${x}px ${TRACK_Y}px` }}
            />
            {[[-34,-34,1,1],[34,-34,-1,1],[-34,34,1,-1],[34,34,-1,-1]].map(([dx,dy,sx,sy], b) => (
              <motion.path key={b}
                d={`M${x+dx},${TRACK_Y+dy+8*sy} v${-8*sy} h${8*sx}`}
                fill="none" stroke="#52606C" strokeWidth="1.4"
                initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.22 }}
              />
            ))}
            <motion.text x={x} y={TRACK_Y + 5} textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="14" fill="#ECE8E1"
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 + i * 0.22 }}>
              {PHASES[i].id}
            </motion.text>
          </g>
        ))}
      </svg>

      <div className={styles.labels}>
        {PHASES.map((p, i) => (
          <motion.div className={styles.labelBlock} key={p.id}
            initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <h4 className={styles.labelTitle}>{p.title}</h4>
            <div className={styles.labelTags}>
              {p.tags.map(t => <span key={t} className={styles.labelTag}>{t}</span>)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
