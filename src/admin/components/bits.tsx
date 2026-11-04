import type { ReactNode } from 'react'
import styles from '../admin.module.css'

/**
 * A content row's state, as plain words after its title: "Draft" in a quieter italic, "Sample"
 * in the site's amber. Nothing for a published, real row, which is most of them.
 */
export function RowFlags({ placeholder, published }: { placeholder?: boolean; published?: boolean }) {
  if (!placeholder && published !== false) return null
  return (
    <span className={styles.flags}>
      {published === false && <span className={styles.flagDraft}>Draft</span>}
      {placeholder && (
        <span className={styles.flagSample} title="Made-up sample content">
          Sample
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
