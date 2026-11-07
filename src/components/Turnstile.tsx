// Cloudflare Turnstile, the "verify you are human" check on the public forms. It runs invisibly
// for almost everyone (appearance: interaction-only) and only shows its checkbox when Cloudflare
// wants a click. The Worker checks the token it produces (worker/lib/turnstile.ts).

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { ApiError } from '../lib/api'
import styles from './Turnstile.module.css'

declare global {
  interface ImportMetaEnv {
    readonly VITE_TURNSTILE_SITE_KEY?: string
  }
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | undefined
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// The real key comes from .env.production. `vite dev` uses Cloudflare's always-pass test key.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? '1x00000000000000000000AA' : '')

const NOT_HUMAN = 'Couldn’t confirm you’re human. Try again.'
const NEEDS_CLICK = 'Tick the “Verify you are human” box, then send again.'
const NOT_SET_UP = 'Form protection isn’t set up yet, so this form can’t take submissions.'

/** How long a submit waits for a token that's still on its way before giving up. */
const WAIT_MS = 15_000

let loading: Promise<TurnstileApi> | null = null

/** Loads Cloudflare's script once per page, however many forms ask for it. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')))
    script.onerror = () => {
      // Let the next form try again (a blocker or a flaky network, say).
      loading = null
      script.remove()
      reject(new Error('Turnstile failed to load'))
    }
    document.head.append(script)
  })
  return loading
}

export interface TurnstileHandle {
  /** The current token, waiting briefly if the check is still running. Rejects with an ApiError to show. */
  token: () => Promise<string>
  /** Tokens are single-use: call after every submit so a retry gets a fresh one. */
  reset: () => void
}

interface Waiter {
  resolve: (token: string) => void
  reject: (error: ApiError) => void
}

/** `action` names the form in Turnstile's analytics; the Worker checks the token was made for it. */
export function Turnstile({ action, ref }: { action: string; ref: Ref<TurnstileHandle> }) {
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const token = useRef<string | null>(null)
  const interactive = useRef(false)
  const waiters = useRef<Waiter[]>([])
  // Whether the checkbox is on screen; while it isn't, the empty row shouldn't add the form's gap.
  const [shown, setShown] = useState(false)

  const settle = (outcome: { token: string } | { error: string }) => {
    const pending = waiters.current
    waiters.current = []
    for (const waiter of pending) {
      if ('token' in outcome) waiter.resolve(outcome.token)
      else waiter.reject(new ApiError(400, { error: outcome.error }))
    }
  }

  useEffect(() => {
    if (!SITE_KEY) return
    const unmounted = new AbortController()
    loadTurnstile()
      .then((turnstile) => {
        if (unmounted.signal.aborted || !container.current) return
        widget.current =
          turnstile.render(container.current, {
            sitekey: SITE_KEY,
            action,
            theme: 'light',
            size: 'flexible',
            appearance: 'interaction-only',
            // The form sends the token itself, so no hidden input to trip over FormData or focus.
            'response-field': false,
            callback: (value: string) => {
              token.current = value
              interactive.current = false
              settle({ token: value })
            },
            'expired-callback': () => {
              // refresh-expired is 'auto', so a new token follows on its own.
              token.current = null
            },
            'before-interactive-callback': () => {
              interactive.current = true
              setShown(true)
              settle({ error: NEEDS_CLICK })
            },
            'after-interactive-callback': () => {
              interactive.current = false
            },
            'timeout-callback': () => {
              token.current = null
              if (widget.current) turnstile.reset(widget.current)
            },
            'error-callback': () => {
              token.current = null
              settle({ error: NOT_HUMAN })
              // Turnstile retries by itself; returning true says we've handled the error.
              return true
            },
          }) ?? null
      })
      .catch(() => settle({ error: NOT_HUMAN }))

    return () => {
      unmounted.abort()
      settle({ error: NOT_HUMAN })
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
      token.current = null
    }
  }, [action])

  useImperativeHandle(
    ref,
    () => ({
      token: () => {
        if (!SITE_KEY) return Promise.reject(new ApiError(503, { error: NOT_SET_UP }))
        if (token.current) return Promise.resolve(token.current)
        if (interactive.current) return Promise.reject(new ApiError(400, { error: NEEDS_CLICK }))
        return new Promise<string>((resolve, reject) => {
          const waiter: Waiter = {
            resolve: (value) => {
              clearTimeout(timer)
              resolve(value)
            },
            reject: (error) => {
              clearTimeout(timer)
              reject(error)
            },
          }
          const timer = setTimeout(() => {
            waiters.current = waiters.current.filter((other) => other !== waiter)
            reject(new ApiError(400, { error: NOT_HUMAN }))
          }, WAIT_MS)
          waiters.current.push(waiter)
        })
      },
      reset: () => {
        token.current = null
        interactive.current = false
        setShown(false)
        try {
          if (widget.current) window.turnstile?.reset(widget.current)
        } catch {
          // The widget went with its form (a sent RSVP closes it); nothing to reset.
        }
      },
    }),
    [],
  )

  return <div ref={container} className={styles.widget} data-shown={shown || undefined} />
}
