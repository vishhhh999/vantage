import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

function VantageLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 30,28 2,28" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="16,10 24,26 8,26" fill="#FF4655" fillOpacity="0.1" stroke="#FF4655" strokeWidth="1" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="28" stroke="#FF4655" strokeWidth="1" strokeOpacity="0.25"/>
    </svg>
  )
}

export default function LegalShell({ title, updated, sections }) {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.navBrand}>
          <VantageLogo size={22} />
          <span className={styles.wordmark}>VANTAGE</span>
        </Link>
        <Link to="/login" className={styles.navLogin}>Sign in</Link>
      </nav>

      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated {updated}</p>

        {sections.map(s => (
          <section className={styles.section} key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((p, i) => <p key={i}>{p}</p>)}
          </section>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <VantageLogo size={16} />
          <span className={styles.wordmark}>VANTAGE</span>
        </div>
        <nav className={styles.footerLinks}>
          <Link to="/process">Process</Link>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of service</Link>
        </nav>
        <span className={styles.footerNote}>Not affiliated with Riot Games, Inc.</span>
      </footer>
    </div>
  )
}
