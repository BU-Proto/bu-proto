import { Link } from 'react-router'
import { PRIVACY_NOTE } from '../content/legal'
import styles from './PrivacyNote.module.css'

/** One quiet line under a form that asks for personal details, pointing at /privacy. */
export function PrivacyNote({ text, className }: { text: string; className?: string }) {
  return (
    <p className={[styles.note, className].filter(Boolean).join(' ')} data-fog-clear>
      {text}{' '}
      <Link className={styles.link} to={PRIVACY_NOTE.href}>
        {PRIVACY_NOTE.link}
      </Link>
    </p>
  )
}
