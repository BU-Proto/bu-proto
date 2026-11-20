import { Hono } from 'hono'
import type { AppEnv } from '../types'

// Today and the Inbox's queue: /api/admin/today, /api/admin/queue*. Shared work.
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

export default app
