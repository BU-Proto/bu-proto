import type { Context } from 'hono'
import { canChange, whoCanChange, type Gate } from '../../shared/access'
import type { AppEnv } from '../types'
import { ApiError } from './http'

// Server-side checks for who can change what (shared/access.ts says what each gate covers).
// Reading is never gated: every /api/admin GET is open to anyone signed in.

/** 403 unless the signed-in admin may make changes behind this gate. Call at the top of a write. */
export function requireGate(c: Context<AppEnv>, gate: Gate): void {
  if (!canChange(c.var.admin, gate)) throw new ApiError(403, whoCanChange(gate))
}

/** Whether the signed-in admin may make changes behind this gate, for a write that's only partly gated. */
export function mayChange(c: Context<AppEnv>, gate: Gate): boolean {
  return canChange(c.var.admin, gate)
}
