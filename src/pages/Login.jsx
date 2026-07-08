import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

function VantageLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="16,2 30,28 2,28" fill="none" stroke="#b8f5a0" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="16,10 24,26 8,26" fill="#b8f5a0" fillOpacity="0.12" stroke="#b8f5a0" strokeWidth="1" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="28" stroke="#b8f5a0" strokeWidth="1" strokeOpacity="0.3"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const { error: sbError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      })
      if (sbError) throw sbError
      setSent(true)
    } catch (err) {
      const msg = err.message || 'Failed to send login link'
      if (/invalid path/i.test(msg)) {
        setError('Supabase project URL looks misconfigured. Double-check VITE_SUPABASE_URL in Vercel — it should be exactly https://your-project-ref.supabase.co with nothing extra.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden>
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className={styles.gridCell} />
        ))}
      </div>

      <Link to="/" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </Link>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.cardHeader}>
          <VantageLogo size={28} />
          <span className={styles.wordmark}>VANTAGE</span>
        </div>

        {!sent ? (
          <>
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.subtitle}>
              Save your reports and track improvement over time. Enter your email and we'll send a magic link.
            </p>
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email address</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoFocus
                  autoComplete="email"
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.submitBtn}
                type="submit"
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
            <p className={styles.skipNote}>
              Just want a quick analysis?{' '}
              <Link to="/" className={styles.skipLink}>Continue without signing in</Link>
            </p>
          </>
        ) : (
          <motion.div
            className={styles.sentState}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.sentIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#b8f5a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.sentTitle}>Check your email</h2>
            <p className={styles.sentDesc}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
            </p>
            <button className={styles.resendBtn} onClick={() => setSent(false)}>
              Use a different email
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
