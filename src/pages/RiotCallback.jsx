import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { exchangeRiotCode } from '../lib/riotAuth'
import { getCurrentUser, linkRiotId, saveReport } from '../lib/dashboard'
import { runFullAnalysis } from '../lib/analysis'
import styles from './RiotCallback.module.css'

const STAGES = ['Confirming your Riot account...', 'Linking to VANTAGE...', 'Running your first analysis...']

export default function RiotCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [stage, setStage] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      const code = searchParams.get('code')
      const riotError = searchParams.get('error')

      if (riotError) {
        setError(`Riot sign-in was cancelled or denied (${riotError}).`)
        return
      }
      if (!code) {
        setError('Missing authorization code from Riot. Try signing in again.')
        return
      }

      try {
        const user = await getCurrentUser()
        if (!user) { navigate('/login'); return }

        setStage(0)
        const { gameName, tagLine, region } = await exchangeRiotCode(code)
        if (cancelled) return
        const riotId = `${gameName}#${tagLine}`

        setStage(1)
        await linkRiotId(user.id, riotId, region)
        if (cancelled) return

        setStage(2)
        const analysis = await runFullAnalysis(riotId, region)
        if (cancelled) return
        await saveReport(user.id, riotId, region, analysis)

        navigate('/dashboard')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong linking your Riot account.')
      }
    }

    run()
    return () => { cancelled = true }
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p className={styles.errorLabel}>Riot sign-in failed</p>
          <p className={styles.errorMsg}>{error}</p>
          <Link to="/dashboard" className={styles.retryBtn}>Try again</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
      <div className={styles.stages}>
        {STAGES.map((s, i) => (
          <div key={s} className={styles.stage} data-active={i === stage} data-done={i < stage}>
            <span className={styles.dot} />
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
