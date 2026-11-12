import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type PushToast, type ToastInput, type ToastTone } from '../lib/toast'
import { AlertIcon, CheckIcon, CloseIcon } from './icons'
import styles from './Toasts.module.css'

interface ToastItem extends ToastInput {
  id: number
  tone: ToastTone
}

// What people expect from the libraries they've used: four seconds, three on screen, and the
// clock stops while the pointer is over the stack or the tab is in the background.
const LIFETIME = 4000
const ERROR_LIFETIME = 7000
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)), [])

  const push = useCallback<PushToast>((input) => {
    const toast = typeof input === 'string' ? { text: input } : input
    const item: ToastItem = { ...toast, tone: toast.tone ?? 'ok', id: nextId.current++ }
    setToasts((list) => [...list, item].slice(-MAX_VISIBLE))
  }, [])

  return (
    <ToastContext value={push}>
      {children}
      {/* Both regions always exist, so screen readers pick up what's added to them. */}
      <div className={styles.stack}>
        <div role="status" className={styles.region}>
          {toasts
            .filter((toast) => toast.tone !== 'error')
            .map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
        <div role="alert" className={styles.region}>
          {toasts
            .filter((toast) => toast.tone === 'error')
            .map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const remaining = useRef(toast.tone === 'error' ? ERROR_LIFETIME : LIFETIME)

  const leave = useCallback(() => setLeaving(true), [])

  // The countdown, which picks up where it stopped after a pause.
  useEffect(() => {
    if (paused || leaving) return
    const started = Date.now()
    const timer = setTimeout(leave, remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - started
    }
  }, [paused, leaving, leave])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Gone once the exit has played; the timer covers reduced motion, where nothing animates.
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => onDismiss(toast.id), 180)
    return () => clearTimeout(timer)
  }, [leaving, onDismiss, toast.id])

  return (
    <div
      className={styles.toast}
      data-tone={toast.tone}
      data-leaving={leaving || undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.mark} aria-hidden="true">
        {toast.tone === 'error' ? <AlertIcon /> : <CheckIcon />}
      </span>
      <div className={styles.text}>
        <p className={styles.title}>{toast.text}</p>
        {toast.detail && <p className={styles.detail}>{toast.detail}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            toast.action?.onAction()
            leave()
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className={styles.close} aria-label="Dismiss" onClick={leave}>
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  )
}
