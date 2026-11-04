import { useEffect, useId, useRef, type ReactNode } from 'react'
import ui from '../../admin.module.css'
import styles from './people.module.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  /** Red confirm button, for deletes. */
  danger?: boolean
  busy?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A modal <dialog>: the browser handles focus trapping, Escape and the backdrop. Cancel takes
 * focus first so a stray Enter never confirms a delete.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // React's autoFocus fires at mount, while the dialog is still closed, so focus by hand.
      dialog.querySelector<HTMLButtonElement>('[data-cancel]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <h2 id={titleId} className={styles.dialogTitle}>
        {title}
      </h2>
      {children && <div className={styles.dialogBody}>{children}</div>}
      <p className={styles.error} role="alert" hidden={!error}>
        {error}
      </p>
      <div className={styles.dialogActions}>
        <button type="button" className={ui.secondary} onClick={onCancel} disabled={busy} data-cancel>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? styles.danger : ui.primary}
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
