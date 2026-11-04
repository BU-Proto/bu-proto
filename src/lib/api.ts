import type { ApiErrorBody } from '../../shared/api'

/** A failed API call: the status, the message to show, and per-field messages for forms. */
export class ApiError extends Error {
  readonly status: number
  readonly issues: Record<string, string>

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.error ?? `Request failed (${status}).`)
    this.status = status
    this.issues = body.issues ?? {}
  }
}

/**
 * Call the Worker's API. JSON in, JSON out; throws ApiError on any non-2xx. 204 resolves to
 * undefined. Cookies ride along, so admin calls work once signed in.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
    credentials: 'same-origin',
  })
  if (response.status === 204) return undefined as T
  const data: unknown = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, data as Partial<ApiErrorBody>)
  return data as T
}
