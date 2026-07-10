import { motion } from 'framer-motion'
import { agentIconPath, mapImagePath, weaponIconPath } from '../lib/assets'
import styles from './ReportVisuals.module.css'

// ── Map grid: 3 map thumbnails with a winrate ring, best/worst flagged ──
export function MapGrid({ maps }) {
  return (
    <div className={styles.mapGrid}>
      {maps.map(m => (
        <div className={styles.mapCard} key={m.slug} data-tier={m.tier}>
          <div className={styles.mapImgWrap}>
            <img src={mapImagePath(m.slug)} alt={m.slug} />
            <span className={styles.mapRing} data-tier={m.tier}>{m.wr}%</span>
          </div>
          <div className={styles.mapMeta}>
            <span className={styles.mapName}>{m.slug}</span>
            <span className={styles.mapRecord}>{m.record}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Agent compare: current agent vs suggested agent, winrate bars, VS divider ──
export function AgentCompare({ from, to }) {
  return (
    <div className={styles.agentCompare}>
      <div className={styles.agentSide}>
        <div className={styles.agentPortraitLg}><img src={agentIconPath(from.slug)} alt={from.slug} /></div>
        <span className={styles.agentName}>{from.slug}</span>
        <div className={styles.agentBarTrack}>
          <motion.div className={styles.agentBarFill} data-tone="cold"
            initial={{ width: 0 }} animate={{ width: `${from.wr}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <span className={styles.agentWr}>{from.wr}% WR</span>
      </div>
      <div className={styles.vsDivider}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12M12 5l5 5-5 5" stroke="#FF4655" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className={styles.agentSide}>
        <div className={styles.agentPortraitLg} data-highlight="true"><img src={agentIconPath(to.slug)} alt={to.slug} /></div>
        <span className={styles.agentName}>{to.slug}</span>
        <div className={styles.agentBarTrack}>
          <motion.div className={styles.agentBarFill} data-tone="hot"
            initial={{ width: 0 }} animate={{ width: `${to.wr}%` }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <span className={styles.agentWr}>{to.wr}% WR</span>
      </div>
    </div>
  )
}

// ── Trend sparkline: per-match value line with a flagged drop zone ──
export function TrendChart({ points, flagFrom }) {
  const w = 480, h = 120, pad = 10
  const max = Math.max(...points), min = Math.min(...points)
  const range = max - min || 1
  const step = (w - pad * 2) / (points.length - 1)
  const coords = points.map((v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <div className={styles.trendWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.trendSvg} preserveAspectRatio="none">
        {flagFrom != null && (
          <rect x={pad + flagFrom * step} y={0} width={w - pad - (pad + flagFrom * step)} height={h} fill="rgba(255,70,85,0.08)" />
        )}
        <motion.path d={path} fill="none" stroke="#5CE1E6" strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i >= (flagFrom ?? Infinity) ? 3.5 : 2.5}
            fill={i >= (flagFrom ?? Infinity) ? '#FF4655' : '#5CE1E6'} />
        ))}
      </svg>
      <div className={styles.trendAxis}>
        <span>Match 1</span><span>Match {points.length}</span>
      </div>
    </div>
  )
}

// ── Radial gauge: single percentage, color by severity ──
export function RadialGauge({ value, label, tone = 'accent' }) {
  const r = 40, c = 2 * Math.PI * r
  return (
    <div className={styles.gaugeWrap}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} stroke="var(--elevated)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="55" cy="55" r={r} stroke={tone === 'accent' ? '#FF4655' : '#5CE1E6'} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={c} transform="rotate(-90 55 55)"
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <text x="55" y="60" textAnchor="middle" fontSize="22" fontFamily="Bebas Neue" fill="#ECE8E1">{value}%</text>
      </svg>
      <span className={styles.gaugeLabel}>{label}</span>
    </div>
  )
}

// ── Split bars: two conditions compared side by side ──
export function SplitBars({ a, b }) {
  const max = Math.max(a.v, b.v, 1)
  return (
    <div className={styles.splitBars}>
      {[a, b].map((item, i) => (
        <div className={styles.splitRow} key={item.label}>
          <span className={styles.splitLabel}>{item.label}</span>
          <div className={styles.splitTrack}>
            <motion.div className={styles.splitFill} data-flagged={item.flagged || undefined}
              initial={{ width: 0 }} animate={{ width: `${(item.v / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <span className={styles.splitVal}>{item.v}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Weapon duel bars: weapon icon rows with win% ──
export function WeaponDuels({ weapons }) {
  return (
    <div className={styles.weaponDuels}>
      {weapons.map(w => (
        <div className={styles.weaponRow} key={w.slug}>
          <div className={styles.weaponIcon}><img src={weaponIconPath(w.slug)} alt={w.slug} /></div>
          <span className={styles.weaponName}>{w.slug}</span>
          <div className={styles.weaponBarTrack}>
            <motion.div className={styles.weaponBarFill} data-low={w.wr < 50 || undefined}
              initial={{ width: 0 }} animate={{ width: `${w.wr}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <span className={styles.weaponWr}>{w.wr}%</span>
        </div>
      ))}
    </div>
  )
}
