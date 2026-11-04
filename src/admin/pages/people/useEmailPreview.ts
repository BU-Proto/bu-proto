import { useEffect, useState } from 'react'
import type { EmailAudience, EmailPreview } from '../../../../shared/api'
import { api, type ApiError } from '../../../lib/api'
import { isAbort, toApiError, useDebounced } from './useApi'

interface State {
  preview: EmailPreview | undefined
  error: ApiError | undefined
  /** The request that last finished, ok or not. */
  settled: string | null
}

/**
 * The real rendered email for one recipient, from the Worker. Typing is debounced; switching
 * audience or stepping through recipients asks right away. The last good preview stays up while
 * the next one loads, and while a failing one is retried.
 */
export function useEmailPreview(audience: EmailAudience | null, subject: string, body: string, index: number) {
  const draft = useDebounced(JSON.stringify([subject, body]), 400)
  const request = audience ? JSON.stringify({ audience, index, draft }) : null
  const [state, setState] = useState<State>({ preview: undefined, error: undefined, settled: null })

  useEffect(() => {
    if (request === null) return
    const { audience, index, draft } = JSON.parse(request) as { audience: EmailAudience; index: number; draft: string }
    const [subject, body] = JSON.parse(draft) as [string, string]
    const controller = new AbortController()
    api<EmailPreview>('/admin/email/preview', {
      method: 'POST',
      body: { audience, subject, body, index },
      signal: controller.signal,
    })
      .then((preview) => setState({ preview, error: undefined, settled: request }))
      .catch((error: unknown) => {
        if (isAbort(error)) return
        setState((prev) => ({ ...prev, error: toApiError(error), settled: request }))
      })
    return () => controller.abort()
  }, [request])

  return { preview: state.preview, error: state.error, loading: request !== null && state.settled !== request }
}
