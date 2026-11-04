import { Hono } from 'hono'
import type { AppEnv } from '../types'

// TODO: implemented in parallel; see the plan in shared/api.ts.
const app = new Hono<AppEnv>()

export default app
