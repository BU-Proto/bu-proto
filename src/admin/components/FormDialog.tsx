import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import ui from '../admin.module.css'
import { CloseIcon } from './icons'
import styles from './FormDialog.module.css'
import { SegmentGroup } from './SegmentGroup'

interface FormDialogProps {
  open: boolean
  title: string
  /** The main button's label ("Save", "Add deal"). */
  submitLabel: string
  busy?: boolean
  /** Why the save failed, under the fields. */
  error?: string
  /** A quiet line beside the buttons: where the thing will show up. */
  note?: ReactNode
  /** Disables the main button, with a title saying who can (from useGated). */
  gated?: { disabled?: boolean; title?: string }
  onSubmit: () => void
  onClose: () => void
  children: ReactNode
}

/**
 * A modal form, the portal's <dialog> the way ConfirmDialog opens one: the browser traps focus
 * and Escape closes it (unless it's saving). The form's own submit runs onSubmit, so Enter in a
 * one-line field saves.
 */
export function FormDialog({ open, title, submitLabel, busy, error, note, gated, onSubmit, onClose, children }: FormDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!busy) onSubmit()
  }

  return (
    <dialog
      ref={ref}
      className={`${ui.dialog} ${styles.dialog}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      {open && (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.head}>
            <h2 id={titleId} className={ui.dialogTitle}>
              {title}
            </h2>
            <button type="button" className={`${ui.ghost} ${ui.small} ${styles.close}`} aria-label="Close" onClick={onClose} disabled={busy}>
              <CloseIcon />
            </button>
          </div>
          <div className={styles.body}>
            {children}
            <p className={ui.error} role="alert" hidden={!error}>
              {error}
            </p>
          </div>
          <div className={styles.foot}>
            <span className={styles.note}>{note}</span>
            <button type="button" className={ui.button} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className={ui.primary} disabled={busy || gated?.disabled} title={gated?.title}>
              {busy ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

/** A segmented control for a form: one button per option, the chosen one pressed. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <SegmentGroup label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={ui.tab}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </SegmentGroup>
  )
}
