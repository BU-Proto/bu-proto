import { useId, type ReactNode } from 'react'
import styles from '../admin.module.css'

export interface ControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  /** Renders the control with the ids that tie it to its label, hint and error. */
  children: (props: ControlProps) => ReactNode
}

/** Label, control, hint and error, wired together for screen readers. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
