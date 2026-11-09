import {
  cloneElement,
  createContext,
  isValidElement,
  use,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ApiError } from '../lib/api'
import { Turnstile, type TurnstileHandle } from './Turnstile'
import ui from './ui.module.css'
import styles from './Form.module.css'

/** What a <Form> hands its fields: the server's per-field messages and ids to point at them. */
const IssuesContext = createContext<{ issues: Record<string, string>; idPrefix: string }>({ issues: {}, idPrefix: '' })

interface ControlProps {
  name?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

interface FieldProps {
  label: string
  hint?: string
  /** Spans both columns of the form grid. */
  wide?: boolean
  /** One input, select or textarea. Its `name` picks up the server's message for that field. */
  children: ReactNode
}

/** A label above its control, and the server's message for it under it. */
export function Field({ label, hint, wide, children }: FieldProps) {
  const { issues, idPrefix } = use(IssuesContext)
  const control = isValidElement<ControlProps>(children) ? (children as ReactElement<ControlProps>) : null
  const name = control?.props.name
  const issue = name ? issues[name] : undefined
  const issueId = `${idPrefix}-${name}-issue`

  return (
    <label className={styles.field} data-wide={wide || undefined}>
      <span className={styles.label} data-fog-clear>
        {label}
      </span>
      {control && issue
        ? cloneElement(control, { 'aria-invalid': true, 'aria-describedby': issueId })
        : children}
      {issue && (
        <span id={issueId} className={styles.issue} data-fog-clear>
          {issue}
        </span>
      )}
      {hint && (
        <span className={styles.hint} data-fog-clear>
          {hint}
        </span>
      )}
    </label>
  )
}

export type FormValues = Record<string, string>

interface FormProps {
  submitLabel: string
  pendingLabel?: string
  /** Shown in place of the form once it's sent. Leave it out to let the parent swap the form out. */
  thanks?: { title: string; text: string }
  /** Gets the form's values by input name; reject (ideally with an ApiError) to show what went wrong. */
  onSubmit: (values: FormValues) => Promise<unknown>
  /** More buttons beside the submit, e.g. Cancel. */
  actions?: ReactNode
  className?: string
  /**
   * Puts a Turnstile check on the form, named for this action (the Worker expects the same name),
   * and sends its token as `cf-turnstile-response` with the values.
   */
  turnstile?: string
  children: ReactNode
}

/** The token's field in the values, and the key the server's complaint about it comes back under. */
const TOKEN_FIELD = 'cf-turnstile-response'

const NETWORK_ERROR = 'Couldn’t reach the server. Check your connection and try again.'

/**
 * A two-column form that sends its values with `onSubmit` and swaps to a thank-you note once
 * that resolves. The browser checks the fields first; the server's per-field messages show under
 * the matching field.
 */
export function Form({
  submitLabel,
  pendingLabel = 'Sending…',
  thanks,
  onSubmit,
  actions,
  className,
  turnstile,
  children,
}: FormProps) {
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const idPrefix = useId()
  const thanksRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const human = useRef<TurnstileHandle>(null)

  if (sent && thanks) {
    return (
      <div ref={thanksRef} className={styles.thanks} role="status" tabIndex={-1}>
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const values: FormValues = {}
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string') values[key] = value
    }

    setPending(true)
    setError(null)
    setIssues({})
    let spent = false
    try {
      if (turnstile && human.current) {
        values[TOKEN_FIELD] = await human.current.token()
        spent = true
      }
      await onSubmit(values)
      human.current?.reset()
      setPending(false)
      setSent(true)
      // The submit button is gone with the form, so keep focus somewhere that reads the thanks.
      requestAnimationFrame(() => thanksRef.current?.focus())
    } catch (caught) {
      // Tokens are single-use, so a retry needs a fresh one. One that never came (the box still
      // wants a tick) is left alone.
      if (spent) human.current?.reset()
      setPending(false)
      const found = caught instanceof ApiError ? caught.issues : {}
      setIssues(found)
      setError(caught instanceof ApiError ? caught.message : NETWORK_ERROR)
      requestAnimationFrame(() => {
        const first = Object.keys(found)
          .map((name) => form.elements.namedItem(name))
          .find((element): element is HTMLElement => element instanceof HTMLElement)
        ;(first ?? errorRef.current)?.focus()
      })
    }
  }

  // Editing a field retires the server's complaint about it.
  const clearIssue = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement).name
    if (!name || !issues[name]) return
    setIssues((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  return (
    <IssuesContext value={{ issues, idPrefix }}>
      <form
        className={[styles.form, className].filter(Boolean).join(' ')}
        onSubmit={submit}
        onInput={clearIssue}
        aria-busy={pending || undefined}
        data-fog-ignore
      >
        {children}
        {turnstile && <Turnstile action={turnstile} ref={human} />}
        {/* Bots fill every field; people never see or reach this one. */}
        <input className={styles.trap} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
        {error && (
          <p ref={errorRef} className={styles.error} role="alert" tabIndex={-1} data-fog-clear>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="submit" className={ui.primary} disabled={pending} data-fog-clear="box">
            {pending ? pendingLabel : submitLabel}
          </button>
          {actions}
        </div>
      </form>
    </IssuesContext>
  )
}
