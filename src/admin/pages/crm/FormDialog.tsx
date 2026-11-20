import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import ui from '../../admin.module.css'
import styles from './crm.module.css'

interface FormDialogProps {
  open: boolean
  title: string
  submitLabel: string
  busy?: boolean
  /** What went wrong with the last submit, under the fields. */
  error?: string
  onSubmit: () => void
  onClose: () => void
  children: ReactNode
}

/**
 * A modal <dialog> holding a short form: the browser traps focus and Escape closes it. The first
 * field takes focus when it opens, since these are opened to type into.
 */
export function FormDialog({ open, title, submitLabel, busy, error, onSubmit, onClose, children }: FormDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('input, select, textarea')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!busy) onSubmit()
  }

  return (
    <dialog
      ref={ref}
      className={`${ui.dialog} ${styles.formDialog}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <form className={ui.dialogBody} onSubmit={submit} noValidate>
        <h2 id={titleId} className={ui.dialogTitle}>
          {title}
        </h2>
        <div className={styles.form}>{open && children}</div>
        <p className={ui.error} role="alert">
          {error}
        </p>
        <div className={ui.dialogActions}>
          <button type="button" className={ui.button} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={ui.primary} disabled={busy} aria-busy={busy || undefined}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
