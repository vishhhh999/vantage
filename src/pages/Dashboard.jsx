import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', letterSpacing: '0.18em' }}>
        VAN<span style={{ color: 'var(--accent)' }}>T</span>AGE
      </span>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Dashboard coming in v2 — requires Riot RSO production key.</p>
      <Link to="/" style={{ color: 'var(--accent)', fontSize: '14px' }}>← Back to home</Link>
    </div>
  )
}
