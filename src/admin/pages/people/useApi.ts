import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../../../lib/api'

interface State<T> {
  data: T | undefined
  error: ApiError | undefined
  /** The request (path and reload count) that last finished, ok or not. */
  settled: string | null
  /** The path `data` came from, so a page can tell a fresh result from the previous one. */
  dataPath: string | null
}

/** Anything thrown by fetch (offline, a CORS hiccup) becomes an ApiError so pages handle one shape. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(0, { error: 'Couldn’t reach the server. Check your connection and try again.' })
}

export const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * GET a path and keep the last good result while the next one loads, so a list doesn't blank
 * out on every keystroke. Pass null to skip. `setData` lets a page apply its own edits locally.
 */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, settled: null, dataPath: null })
  const [nonce, setNonce] = useState(0)
  const request = path === null ? null : `${nonce} ${path}`

  useEffect(() => {
    if (path === null) return
    const controller = new AbortController()
    api<T>(path, { signal: controller.signal })
      .then((data) => setState({ data, error: undefined, settled: request, dataPath: path }))
      .catch((error: unknown) => {
        if (isAbort(error)) return
        setState((prev) => ({ ...prev, error: toApiError(error), settled: request }))
      })
    return () => controller.abort()
  }, [path, request])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback((update: (data: T | undefined) => T | undefined) => {
    setState((prev) => ({ ...prev, data: update(prev.data) }))
  }, [])

  const loading = request !== null && state.settled !== request
  return { data: state.data, error: state.error, dataPath: state.dataPath, loading, reload, setData }
}

/** A value that settles `delay` ms after it stops changing. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return settled
}
