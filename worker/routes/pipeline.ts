import { Hono } from 'hono'
import type { AppEnv } from '../types'

// Deals: /api/admin/deals*. Every write needs Partnerships.
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

export default app
