import { useEffect, useRef } from 'react'
import styles from './TacticalRadar.module.css'

const BLIP_LABELS = [
  'agent mismatch', 'rotation read', 'util timing', 'econo call',
  'clutch conversion', 'entry timing', 'trade window', 'map control',
  'site retake', 'crosshair drift'
]

export default function TacticalRadar({ size = 480, dense = false }) {
  const canvasRef = useRef(null)
  const sweepRef = useRef(0)
  const blipsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const maxR = size / 2 - 20

    function spawnBlip() {
      const angle = Math.random() * Math.PI * 2
      const r = maxR * (0.25 + Math.random() * 0.7)
      blipsRef.current.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        life: 0,
        maxLife: 140 + Math.random() * 60,
        label: BLIP_LABELS[Math.floor(Math.random() * BLIP_LABELS.length)],
        showLabel: Math.random() > 0.55,
      })
    }

    let frame = 0
    const spawnInterval = dense ? 55 : 85

    function draw() {
      frame++
      ctx.clearRect(0, 0, size, size)

      const rings = 4
      for (let i = 1; i <= rings; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (maxR / rings) * i, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(184,245,160,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(cx - maxR, cy)
      ctx.lineTo(cx + maxR, cy)
      ctx.moveTo(cx, cy - maxR)
      ctx.lineTo(cx, cy + maxR)
      ctx.strokeStyle = 'rgba(184,245,160,0.05)'
      ctx.lineWidth = 1
      ctx.stroke()

      sweepRef.current += 0.012
      const sweepAngle = sweepRef.current

      const grad = ctx.createConicGradient
        ? ctx.createConicGradient(sweepAngle - Math.PI / 2, cx, cy)
        : null

      if (grad) {
        grad.addColorStop(0, 'rgba(184,245,160,0)')
        grad.addColorStop(0.08, 'rgba(184,245,160,0.22)')
        grad.addColorStop(0.16, 'rgba(184,245,160,0)')
        grad.addColorStop(1, 'rgba(184,245,160,0)')
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2)
        ctx.clip()
        ctx.fillStyle = grad
        ctx.fillRect(cx - maxR, cy - maxR, maxR * 2, maxR * 2)
        ctx.restore()
      }

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR)
      ctx.strokeStyle = 'rgba(184,245,160,0.6)'
      ctx.lineWidth = 1
      ctx.stroke()

      if (frame % spawnInterval === 0 && blipsRef.current.length < (dense ? 7 : 4)) {
        spawnBlip()
      }

      blipsRef.current = blipsRef.current.filter(b => b.life < b.maxLife)
      blipsRef.current.forEach(b => {
        b.life++
        const t = b.life / b.maxLife
        const fadeIn = Math.min(1, b.life / 12)
        const fadeOut = t > 0.8 ? (1 - t) / 0.2 : 1
        const opacity = fadeIn * fadeOut
        const pulse = 1 + Math.sin(b.life * 0.2) * 0.15

        ctx.beginPath()
        ctx.arc(b.x, b.y, 3 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(184,245,160,${opacity})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(b.x, b.y, 8 * pulse, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(184,245,160,${opacity * 0.35})`
        ctx.lineWidth = 1
        ctx.stroke()

        if (b.showLabel && opacity > 0.4) {
          ctx.font = '10px DM Sans, sans-serif'
          ctx.fillStyle = `rgba(240,236,228,${opacity * 0.75})`
          ctx.fillText(b.label, b.x + 12, b.y + 3)
        }
      })

      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(240,236,228,0.9)'
      ctx.fill()

      requestAnimationFrame(draw)
    }

    const raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [size, dense])

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className={styles.outerRing} style={{ width: size, height: size }} />
      <span className={styles.cornerLabel} data-pos="tl">SCANNING</span>
      <span className={styles.cornerLabel} data-pos="br">20 MATCHES</span>
    </div>
  )
}
