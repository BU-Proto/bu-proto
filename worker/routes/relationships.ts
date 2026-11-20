import { Hono } from 'hono'
import type { AppEnv } from '../types'

// People and Orgs: /api/admin/people*, /api/admin/orgs*. Shared work, except an org's wall, wallOrder and logo (Partnerships).
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

export default app
