import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from '../admin.module.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Red confirm button, for deletes. */
  danger?: boolean
  busy?: boolean
  /** Shown under the text when the confirmed action failed. */
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/** A modal <dialog>: the browser traps focus and Escape cancels it. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
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
      <div className={styles.dialogBody}>
        <h2 id={titleId} className={styles.dialogTitle}>
          {title}
        </h2>
        {children && <div className={styles.dialogText}>{children}</div>}
        <p className={styles.error} role="alert">
          {error}
        </p>
        <div className={styles.dialogActions}>
          {/* Cancel comes first so it gets the dialog's initial focus, not the destructive button. */}
          <button type="button" className={styles.button} onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? styles.danger : styles.primary} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
