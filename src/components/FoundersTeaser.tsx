import { Link } from 'react-router'
import { FOUNDERS_TEASER } from '../content/founders'
import { CircleMark } from './CircleMark'
import ui from './ui.module.css'
import styles from './FoundersTeaser.module.css'

/**
 * The home page's pointer to the Founders Circle, after the groups. Kept quiet on purpose: one
 * ruled row with the Circle's mark, a small amber label, a sentence and a link.
 */
export function FoundersTeaser() {
  return (
    <section className={styles.teaser} aria-labelledby="founders-circle" data-reveal="rise">
      <CircleMark className={styles.mark} />
      <p className={styles.badge}>{FOUNDERS_TEASER.badge}</p>
      <h2 id="founders-circle" className={styles.title}>
        {FOUNDERS_TEASER.title}
      </h2>
      <p className={styles.text}>{FOUNDERS_TEASER.text}</p>
      <Link className={`${ui.textLink} ${styles.link}`} to={FOUNDERS_TEASER.link.href}>
        {FOUNDERS_TEASER.link.label}
      </Link>
    </section>
  )
}
