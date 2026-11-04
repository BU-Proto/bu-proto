import type { ReactNode } from 'react'
import styles from '../admin.module.css'

/** The flags every content row carries, as small badges after its title. */
export function RowBadges({ placeholder, published }: { placeholder?: boolean; published?: boolean }) {
  if (!placeholder && published !== false) return null
  return (
    <span className={styles.badges}>
      {published === false && <span className={styles.badgeDraft}>draft</span>}
      {placeholder && (
        <span className={styles.badgeSample} title="Made-up sample content">
          sample
        </span>
      )}
    </span>
  )
}

export type StatusTone = 'info' | 'ok' | 'error'

/**
 * One line that announces saves and failures. Both live regions stay in the DOM, because
 * screen readers only announce changes to regions that already exist: progress goes to the
 * polite one, errors to the alert.
 */
export function StatusLine({ tone = 'info', children }: { tone?: StatusTone; children?: ReactNode }) {
  const isError = tone === 'error'
  return (
    <div className={styles.status}>
      <span role="status" className={tone === 'ok' ? styles.statusOk : undefined}>
        {!isError && children}
      </span>
      <span role="alert" className={styles.statusError}>
        {isError && children}
      </span>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
