import type { Me } from '../shared/api'

/** The signed-in admin, set on the context by requireAdmin. */
export interface AdminSession extends Me {
  githubId: number
}

/** Hono's environment for every route: Worker bindings plus per-request variables. */
export interface AppEnv {
  Bindings: Env
  Variables: { admin: AdminSession }
}
