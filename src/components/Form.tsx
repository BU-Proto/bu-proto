import { useState, type FormEvent, type ReactNode } from 'react'
import ui from './ui.module.css'
import styles from './Form.module.css'

interface FieldProps {
  label: string
  hint?: string
  /** Spans both columns of the form grid. */
  wide?: boolean
  children: ReactNode
}

/** A label above its control. */
export function Field({ label, hint, wide, children }: FieldProps) {
  return (
    <label className={styles.field} data-wide={wide || undefined}>
      <span className={styles.label} data-fog-clear>
        {label}
      </span>
      {children}
      {hint && (
        <span className={styles.hint} data-fog-clear>
          {hint}
        </span>
      )}
    </label>
  )
}

interface FormProps {
  submitLabel: string
  thanks: { title: string; text: string }
  children: ReactNode
}

/**
 * A two-column form that swaps to a thank-you note on submit. It doesn't send anything
 * anywhere yet: the browser checks the fields and then we just show the thanks.
 */
export function Form({ submitLabel, thanks, children }: FormProps) {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className={styles.thanks} role="status">
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
        <p className={styles.thanksTitle} data-fog-clear>
          {thanks.title}
        </p>
        <p className={styles.thanksText} data-fog-clear>
          {thanks.text}
        </p>
      </div>
    )
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // TODO: post the form somewhere (a form service, a sheet or our own endpoint). Until then
    // the answers are dropped on the floor.
    setSent(true)
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} data-fog-ignore>
      {children}
      <div className={styles.actions}>
        <button type="submit" className={ui.primary} data-fog-clear="box">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
