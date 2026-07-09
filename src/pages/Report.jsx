import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { runFullAnalysis } from '../lib/analysis'
import { agentIconPath, mapImagePath, rankBadgePath } from '../lib/assets'
import styles from './Report.module.css'

const STAGES = [
  'Pulling your match history...',
  'Scoring decision patterns...',
  'Generating coaching report...',
]

export default function Report() {
  const { puuid: encodedId } = useParams()
  const [searchParams] = useSearchParams()
  const riotId = decodeURIComponent(encodedId)
  const region = searchParams.get('region') || 'ap'

  const [stage, setStage] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const analysis = await runFullAnalysis(riotId, region, s => { if (!cancelled) setStage(s) })
        if (cancelled) return
        setResult(analysis)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong. Check your Riot ID and try again.')
      }
    }

    run()
    return () => { cancelled = true }
  }, [riotId, region])

  if (error) {
    return (
      <div className={styles.errorPage}>
        <Link to="/" className={styles.back}>← Back</Link>
        <div className={styles.errorBox}>
          <p className={styles.errorLabel}>Analysis failed</p>
          <p className={styles.errorMsg}>{error}</p>
          <Link to="/" className={styles.retryBtn}>Try again</Link>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className={styles.loadingPage}>
        <span className={styles.wordmark}>VAN<span>T</span>AGE</span>
        <div className={styles.loadingContent}>
          <p className={styles.loadingRiotId}>{riotId}</p>
          <div className={styles.loadingStages}>
            {STAGES.map((s, i) => (
              <div
                key={s}
                className={styles.loadingStage}
                data-active={i === stage}
                data-done={i < stage}
              >
                <span className={styles.stageDot} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { overview, priorities: displayPriorities, summary } = result
  const rankName = overview?.rankName
  const rankBadge = rankBadgePath(rankName)

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.wordmark}>VAN<span>T</span>AGE</Link>
        <span className={styles.navMeta}>{riotId}</span>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Vantage Report</p>
          <div className={styles.riotIdRow}>
            {rankBadge && <img src={rankBadge} alt={rankName} className={styles.rankBadgeImg} />}
            <div>
              <h1 className={styles.riotId}>{riotId}</h1>
              {rankName && <p className={styles.rankName}>{rankName}</p>}
            </div>
          </div>
          {overview && (
            <div className={styles.overviewRow}>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{overview.matches}</span>
                <span className={styles.overviewLabel}>Matches</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{overview.winRate.toFixed(0)}%</span>
                <span className={styles.overviewLabel}>Win rate</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{overview.kd.toFixed(2)}</span>
                <span className={styles.overviewLabel}>K/D</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{overview.adr.toFixed(0)}</span>
                <span className={styles.overviewLabel}>ADR</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{overview.hsPercent.toFixed(0)}%</span>
                <span className={styles.overviewLabel}>HS%</span>
              </div>
            </div>
          )}
        </header>

        {summary && (
          <div className={`${styles.summary} v-cut-md`}>
            <p className={styles.summaryLabel}>Coach summary</p>
            <p className={styles.summaryText}>{summary}</p>
          </div>
        )}

        <div className={styles.priorities}>
          <p className={styles.prioritiesLabel}>Priority findings</p>
          {displayPriorities.map(p => (
            <div className={`${styles.priorityBlock} v-cut-md`} key={p.rank} data-severity={p.severity}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityMeta}>
                  <span className={styles.priorityRank} data-severity={p.severity}>
                    <span className={styles.rankDot} />
                    Priority {p.rank}
                  </span>
                  <span className={styles.severityBadge} data-severity={p.severity}>
                    {p.severity}
                  </span>
                </div>
                <h2 className={styles.priorityTitle}>{p.label}</h2>
              </div>
              <p className={styles.priorityFinding}>{p.finding}</p>
              <div className={`${styles.priorityFix} v-cut-sm`}>
                <span className={styles.fixLabel}>Fix</span>
                <p>{p.fix}</p>
              </div>
            </div>
          ))}
        </div>

        {overview && (
          <div className={`${styles.breakdown} v-cut-md`}>
            <p className={styles.breakdownLabel}>Agent breakdown</p>
            <div className={styles.agentGrid}>
              {Object.entries(overview.agents)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([agent, data]) => {
                  const wr = (data.wins / data.total) * 100
                  const icon = agentIconPath(agent)
                  return (
                    <div className={styles.agentRow} key={agent}>
                      {icon && <img src={icon} alt={agent} className={styles.agentIcon} />}
                      <span className={styles.agentName}>{agent}</span>
                      <div className={styles.agentBar}>
                        <div
                          className={styles.agentFill}
                          style={{ width: `${wr}%` }}
                          data-good={wr >= 50}
                        />
                      </div>
                      <span className={styles.agentWr} data-good={wr >= 50}>
                        {wr.toFixed(0)}%
                      </span>
                      <span className={styles.agentGames}>{data.total}g</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {overview && Object.keys(overview.maps).length > 0 && (
          <div className={`${styles.breakdown} v-cut-md`}>
            <p className={styles.breakdownLabel}>Map breakdown</p>
            <div className={styles.mapGrid}>
              {Object.entries(overview.maps)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([map, data]) => {
                  const wr = (data.wins / data.total) * 100
                  const thumb = mapImagePath(map)
                  return (
                    <div className={`${styles.mapCard} v-cut-sm`} key={map}>
                      {thumb && (
                        <div className={styles.mapThumbWrap}>
                          <img src={thumb} alt={map} className={styles.mapThumb} />
                        </div>
                      )}
                      <div className={styles.mapCardInfo}>
                        <span className={styles.mapCardName}>{map}</span>
                        <div className={styles.mapCardBar}>
                          <div className={styles.mapCardFill} style={{ width: `${wr}%` }} data-good={wr >= 50} />
                        </div>
                        <div className={styles.mapCardMeta}>
                          <span className={styles.mapCardWr} data-good={wr >= 50}>{wr.toFixed(0)}%</span>
                          <span className={styles.mapCardGames}>{data.total} games</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <Link to="/" className={styles.newAnalysis}>Run another analysis</Link>
          <div className={styles.footerRight}>
            <span className={styles.betaBadge}>v3-beta</span>
            <p className={styles.footerNote}>Not affiliated with Riot Games</p>
          </div>
        </div>
      </div>
    </div>
  )
}
