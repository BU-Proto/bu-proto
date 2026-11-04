import { createContext, useCallback, useContext } from 'react'
import type { Me } from '../../../shared/api'
import { ApiError } from '../../lib/api'

interface Session {
  me: Me
  /** Call when the API answers 401: the shell swaps itself for the sign-in screen. */
  expire: () => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession needs the admin shell above it.')
  return session
}

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

/**
 * For catch blocks around admin calls. Returns true (and ends the session) on a 401 so the
 * caller can stop there; anything else is the caller's to show.
 */
export function useAuthGuard() {
  const { expire } = useSession()
  return useCallback(
    (error: unknown) => {
      if (!isUnauthorized(error)) return false
      expire()
      return true
    },
    [expire],
  )
}

/** A readable message for anything a call can throw. */
export function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.name !== 'AbortError') return error.message
  return 'Something went wrong. Try again.'
}
