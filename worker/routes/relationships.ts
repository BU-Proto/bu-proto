import { Hono, type Context } from 'hono'
import {
  ORG_KINDS,
  orgInput,
  orgPatch,
  parsePersonKey,
  personInput,
  personPatch,
  type OrgKind,
  type PersonRef,
} from '../../shared/crm'
import { requireGate } from '../lib/access'
import { ApiError, idParam, parseInput, readBody } from '../lib/http'
import { atKey, emailKey, matchesQuery } from '../lib/people'
import { loadOrgDetail, loadOrgs, loadPeople, loadPersonDetail } from '../lib/peopleData'
import type { AppEnv } from '../types'

// People and Orgs: /api/admin/people*, /api/admin/orgs*. Shared work, except an org's wall, wallOrder and logo (Partnerships).
// The contract is in shared/crm.ts; the reading is in lib/peopleData.ts.

const app = new Hono<AppEnv>()

function keyParam(c: Context): PersonRef {
  const ref = parsePersonKey(c.req.param('key') ?? '')
  if (!ref) throw new ApiError(404, 'No such person.')
  return ref
}

/** The raw JSON body, for patches that need to know which keys were actually sent. */
async function rawBody(c: Context): Promise<Record<string, unknown>> {
  const raw: unknown = await c.req.json().catch(() => null)
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new ApiError(400, 'Send a JSON body.')
  return raw as Record<string, unknown>
}

async function requireOrg(db: D1Database, orgId: number | null | undefined): Promise<void> {
  if (orgId === null || orgId === undefined) return
  const found = await db.prepare('SELECT 1 FROM orgs WHERE id = ?').bind(orgId).first()
  if (!found) throw new ApiError(400, 'That org no longer exists.', { orgId: 'Pick another org.' })
}

/** UPDATE … SET from column → value pairs, plus updated_at. */
function setClause(changes: Record<string, string | number | null>): { sql: string; values: (string | number | null)[] } {
  const entries = Object.entries(changes)
  if (entries.length === 0) throw new ApiError(400, 'Nothing to change.')
  return {
    sql: [...entries.map(([column]) => `${column} = ?`), "updated_at = datetime('now')"].join(', '),
    values: entries.map(([, value]) => value),
  }
}

// ---- People -----------------------------------------------------------------------------------

app.get('/api/admin/people', async (c) => {
  const kind = c.req.query('kind')
  const q = c.req.query('q')?.trim() ?? ''
  const mine = c.req.query('mine') === '1'
  const me = emailKey(c.var.admin.email)
  const { summaries } = await loadPeople(c.env.DB)
  const items = summaries
    .filter((person) => !kind || person.kind === kind)
    .filter((person) => !mine || (person.ownerEmail !== null && emailKey(person.ownerEmail) === me))
    .filter((person) => matchesQuery([person.name, person.email, person.orgName, person.title], q))
    // Whoever something happened with most recently comes first.
    .sort((a, b) => atKey(b.lastTouch?.at ?? b.createdAt).localeCompare(atKey(a.lastTouch?.at ?? a.createdAt)) || a.name.localeCompare(b.name))
  return c.json({ items })
})

app.get('/api/admin/people/:key', async (c) => c.json({ item: await loadPersonDetail(c.env.DB, keyParam(c)) }))

// Adds a contact, lead or alum. Members only come from the site's sign-up form.
app.post('/api/admin/people', async (c) => {
  const input = await readBody(c, personInput)
  const db = c.env.DB
  const [contact, member] = await db.batch<{ name: string }>([
    db.prepare('SELECT name FROM contacts WHERE email = ?').bind(input.email),
    db.prepare('SELECT name FROM members WHERE email = ?').bind(input.email),
  ])
  const taken = (member.results[0] ?? contact.results[0]) as { name: string } | undefined
  if (taken) {
    throw new ApiError(409, `${taken.name} is already in People with that email.`, { email: member.results[0] ? 'Already a member' : 'Already in People' })
  }
  await requireOrg(db, input.orgId)
  // contacts.organization predates orgs; it's kept filled so asks still read the org's name.
  const row = await db
    .prepare(
      `INSERT INTO contacts (name, email, organization, notes, created_by, org_id, title, kind, owner_email, link)
       VALUES (?, ?, COALESCE((SELECT name FROM orgs WHERE id = ?), ''), ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.name, input.email, input.orgId, input.notes, c.var.admin.email, input.orgId, input.title, input.kind, input.ownerEmail, input.link)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save them.')
  return c.json({ item: await loadPersonDetail(db, { type: 'contact', id: row.id }) }, 201)
})

app.patch('/api/admin/people/:key', async (c) => {
  const ref = keyParam(c)
  const patch = await readBody(c, personPatch)
  const db = c.env.DB
  const changes: Record<string, string | number | null> = {}
  if (patch.name !== undefined) changes.name = patch.name
  if (patch.notes !== undefined) changes.notes = patch.notes
  if (patch.ownerEmail !== undefined) changes.owner_email = patch.ownerEmail

  if (ref.type === 'member') {
    const contactOnly = (['kind', 'orgId', 'title', 'link'] as const).filter((key) => patch[key] !== undefined)
    if (contactOnly.length > 0) {
      throw new ApiError(400, 'Members don’t have a kind, org, title or link.', Object.fromEntries(contactOnly.map((key) => [key, 'Contacts only'])))
    }
    const { sql, values } = setClause(changes)
    const { meta } = await db.prepare(`UPDATE members SET ${sql} WHERE id = ?`).bind(...values, ref.id).run()
    if (!meta.changes) throw new ApiError(404, 'No such member.')
  } else {
    if (patch.kind !== undefined) changes.kind = patch.kind
    if (patch.title !== undefined) changes.title = patch.title
    if (patch.link !== undefined) changes.link = patch.link
    if (patch.orgId !== undefined) {
      await requireOrg(db, patch.orgId)
      changes.org_id = patch.orgId
    }
    const { sql, values } = setClause(changes)
    const statements = [db.prepare(`UPDATE contacts SET ${sql} WHERE id = ?`).bind(...values, ref.id)]
    if (patch.orgId !== undefined) {
      statements.push(
        db.prepare(`UPDATE contacts SET organization = COALESCE((SELECT name FROM orgs WHERE id = org_id), '') WHERE id = ?`).bind(ref.id),
      )
    }
    const [result] = await db.batch(statements)
    if (!result.meta.changes) throw new ApiError(404, 'No such person.')
  }
  return c.json({ item: await loadPersonDetail(db, ref) })
})

// Contacts only: a member is deleted from their page through /api/admin/members/:id, which also
// clears their RSVPs and sign-ups. Their asks and deals stay, without them; their interactions,
// follow-ups, intros and event spots go with them.
app.delete('/api/admin/people/:key', async (c) => {
  const ref = keyParam(c)
  if (ref.type === 'member') throw new ApiError(400, 'Delete a member from their page.')
  const { meta } = await c.env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(ref.id).run()
  if (!meta.changes) throw new ApiError(404, 'No such person.')
  return c.body(null, 204)
})

// ---- Orgs ---------------------------------------------------------------------------------------

const isOrgKind = (value: string | undefined): value is OrgKind => (ORG_KINDS as readonly string[]).includes(value ?? '')

app.get('/api/admin/orgs', async (c) => {
  const kind = c.req.query('kind')
  const q = c.req.query('q')?.trim()
  return c.json({ items: await loadOrgs(c.env.DB, { kind: isOrgKind(kind) ? kind : undefined, q: q || undefined }) })
})

app.get('/api/admin/orgs/:id', async (c) => c.json({ item: await loadOrgDetail(c.env.DB, idParam(c)) }))

async function nameTaken(db: D1Database, name: string, except = 0): Promise<void> {
  const clash = await db.prepare('SELECT 1 FROM orgs WHERE name = ? AND id != ?').bind(name, except).first()
  if (clash) throw new ApiError(409, 'There’s already an org with that name.', { name: 'Already an org' })
}

app.post('/api/admin/orgs', async (c) => {
  const input = await readBody(c, orgInput)
  // A new org only touches the logo wall when it's put on one straight away.
  if (input.wall !== '' || input.wallOrder !== 0 || input.logo !== null) requireGate(c, 'partnerships')
  await nameTaken(c.env.DB, input.name)
  const row = await c.env.DB.prepare(
    `INSERT INTO orgs (name, kind, website, focus, notes, owner_email, wall, wall_order, logo, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(input.name, input.kind, input.website, input.focus, input.notes, input.ownerEmail, input.wall, input.wallOrder, input.logo, c.var.admin.email)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the org.')
  return c.json({ item: await loadOrgDetail(c.env.DB, row.id) }, 201)
})

const ORG_COLUMNS = {
  name: 'name',
  kind: 'kind',
  website: 'website',
  focus: 'focus',
  notes: 'notes',
  ownerEmail: 'owner_email',
  wall: 'wall',
  wallOrder: 'wall_order',
  logo: 'logo',
} as const
const WALL_FIELDS = new Set(['wall', 'wallOrder', 'logo'])

app.patch('/api/admin/orgs/:id', async (c) => {
  const id = idParam(c)
  const raw = await rawBody(c)
  // orgPatch keeps orgInput's defaults, so only the keys that were sent are applied: a patch of
  // the name alone mustn't reset the kind or take the org off its wall.
  const parsed = parseInput(orgPatch, raw) as Record<string, string | number | null>
  const db = c.env.DB
  const current = await db.prepare('SELECT name, wall, wall_order, logo FROM orgs WHERE id = ?').bind(id).first<{ wall: string; wall_order: number; logo: string | null }>()
  if (!current) throw new ApiError(404, 'No such org.')
  const changes: Record<string, string | number | null> = {}
  for (const [key, column] of Object.entries(ORG_COLUMNS)) {
    if (key in raw) changes[column] = parsed[key] ?? null
  }
  // The logo wall is Partnerships'; a save that sends the wall's fields unchanged is fine for anyone.
  const wallChanged = [...WALL_FIELDS].some((key) => {
    const column = ORG_COLUMNS[key as keyof typeof ORG_COLUMNS]
    return column in changes && changes[column] !== current[column as 'wall' | 'wall_order' | 'logo']
  })
  if (wallChanged) requireGate(c, 'partnerships')
  if (typeof changes.name === 'string') await nameTaken(db, changes.name, id)
  const { sql, values } = setClause(changes)
  const statements = [db.prepare(`UPDATE orgs SET ${sql} WHERE id = ?`).bind(...values, id)]
  // Contacts keep the org's name as text for asks; a rename follows through.
  if ('name' in changes) statements.push(db.prepare('UPDATE contacts SET organization = ? WHERE org_id = ?').bind(changes.name, id))
  await db.batch(statements)
  return c.json({ item: await loadOrgDetail(db, id) })
})

// Its contacts stay, without an org. An org with deals can't go: they'd go with it.
app.delete('/api/admin/orgs/:id', async (c) => {
  const id = idParam(c)
  const db = c.env.DB
  const deals = await db.prepare('SELECT COUNT(*) AS n FROM deals WHERE org_id = ?').bind(id).first<{ n: number }>()
  if (deals && deals.n > 0) throw new ApiError(409, 'This org has deals. Delete or move them in Pipeline first.')
  const { meta } = await db.prepare('DELETE FROM orgs WHERE id = ?').bind(id).run()
  if (!meta.changes) throw new ApiError(404, 'No such org.')
  return c.body(null, 204)
})

export default app
