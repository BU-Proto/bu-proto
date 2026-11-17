import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { z } from 'zod'
import type { ApiErrorBody } from '../../shared/api'

/** Throw from any handler to answer with `{ error, issues? }` and the given status. */
export class ApiError extends HTTPException {
  readonly issues?: Record<string, string>

  constructor(status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 500 | 502, message: string, issues?: Record<string, string>) {
    super(status, { message })
    this.issues = issues
  }
}

export function errorBody(error: unknown): { status: number; body: ApiErrorBody } {
  if (error instanceof ApiError) {
    return { status: error.status, body: { error: error.message, ...(error.issues && { issues: error.issues }) } }
  }
  if (error instanceof HTTPException) return { status: error.status, body: { error: error.message } }
  console.error(error)
  return { status: 500, body: { error: 'Something went wrong on our side.' } }
}

/**
 * What a form sent, by field name: a JSON body's object, or a multipart form's fields (a file
 * stays a File). Null when the body is neither. Hono caches the parsed body, so a middleware and
 * the route can both read it.
 */
export async function bodyFields(c: Context): Promise<Record<string, unknown> | null> {
  if ((c.req.header('Content-Type') ?? '').startsWith('multipart/form-data')) {
    const form = await c.req.formData().catch(() => null)
    if (!form) return null
    const fields: Record<string, unknown> = {}
    form.forEach((value, key) => {
      fields[key] = value
    })
    return fields
  }
  const raw: unknown = await c.req.json().catch(() => null)
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
}

/** Read the JSON body and validate it; a bad body answers 400 with one message per field. */
export async function readBody<S extends z.ZodType>(c: Context, schema: S): Promise<z.output<S>> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new ApiError(400, 'Send a JSON body.')
  }
  return parseInput(schema, raw)
}

/** Validate something already read; anything wrong answers 400 with one message per field. */
export function parseInput<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    const issues: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_'
      issues[key] ??= issue.message
    }
    throw new ApiError(400, 'Check the highlighted fields.', issues)
  }
  return result.data
}

/** A positive integer route param, or 404. */
export function idParam(c: Context, name = 'id'): number {
  const id = Number(c.req.param(name))
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, 'Not found.')
  return id
}
