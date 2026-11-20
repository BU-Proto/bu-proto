import { Hono } from 'hono'
import type { AppEnv } from '../types'

// Interactions, follow-ups and intros (shared work): /api/admin/interactions*, /api/admin/follow-ups*, /api/admin/intros*. Event guests (Community): /api/admin/events/:id/guests*.
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

export default app
