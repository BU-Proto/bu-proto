import { Hono, type Context } from 'hono'
import { mayChange, requireGate } from '../lib/access'
import {
  eventGuestInput,
  eventGuestPatch,
  followUpInput,
  followUpPatch,
  interactionInput,
  introInput,
  introPatch,
  parsePersonKey,
  type EventGuest,
  type GuestRole,
  type GuestStatus,
  type Interaction,
  type InteractionKind,
  type Intro,
  type IntroStatus,
} from '../../shared/api'
import { checkOrg, dealOrg, findPerson, FOLLOW_UP_SELECT, personFilter, queryId, readPatch, toFollowUp, type FollowUpRow } from '../lib/crmQueries'
import { compareFollowUps, personIds, personLink, type PersonColumns } from '../lib/crmRows'
import { ApiError, idParam, readBody } from '../lib/http'
import type { AppEnv } from '../types'

// Interactions, follow-ups and intros (shared work): /api/admin/interactions*, /api/admin/follow-ups*, /api/admin/intros*. Event guests (Community): /api/admin/events/:id/guests*.
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

/**
 * Where a logged thing or a follow-up points: a person, an org and a deal. The org comes from the
 * deal, then the contact's org, when it isn't given, so an org's page sees everything said with
 * its people. An interaction needs at least one of the three; a follow-up can stand alone ("Book
 * the room for hack night").
 */
async function resolveLinks(
  db: D1Database,
  input: { personKey: string | null; orgId: number | null; dealId: number | null },
  required = true,
): Promise<{ memberId: number | null; contactId: number | null; orgId: number | null; dealId: number | null }> {
  if (required && input.personKey === null && input.orgId === null && input.dealId === null) {
    throw new ApiError(400, 'Check the highlighted fields.', { personKey: 'Pick who it was with.' })
  }
  const person = input.personKey === null ? null : await findPerson(db, input.personKey, 'personKey')
  let orgId = input.orgId
  if (orgId !== null) await checkOrg(db, orgId)
  if (input.dealId !== null) {
    const fromDeal = await dealOrg(db, input.dealId)
    orgId ??= fromDeal
  }
  orgId ??= person?.orgId ?? null
  return { ...personIds(person?.ref ?? null), orgId, dealId: input.dealId }
}

/** Interactions and follow-ups: the author, or anyone who can change everything. */
function requireAuthor(c: Context<AppEnv>, createdBy: string) {
  if (createdBy.toLowerCase() !== c.var.admin.email.toLowerCase() && !mayChange(c, 'admin')) {
    throw new ApiError(403, 'Only whoever logged this, or an admin, can change it.')
  }
}

// ---- Interactions -------------------------------------------------------------------------------

interface InteractionRow extends PersonColumns {
  id: number
  kind: InteractionKind
  happened_on: string
  summary: string
  org_id: number | null
  org_name: string | null
  deal_id: number | null
  deal_title: string | null
  created_by: string
  created_at: string
}

const INTERACTION_SELECT = `
  SELECT i.id, i.kind, i.happened_on, i.summary, i.member_id, m.name AS member_name, i.contact_id, ct.name AS contact_name,
    co.name AS contact_org_name, i.org_id, o.name AS org_name, i.deal_id, d.title AS deal_title, i.created_by, i.created_at
  FROM interactions i
  LEFT JOIN members m ON m.id = i.member_id
  LEFT JOIN contacts ct ON ct.id = i.contact_id
  LEFT JOIN orgs co ON co.id = ct.org_id
  LEFT JOIN orgs o ON o.id = i.org_id
  LEFT JOIN deals d ON d.id = i.deal_id`

const toInteraction = (row: InteractionRow): Interaction => ({
  id: row.id,
  kind: row.kind,
  happenedOn: row.happened_on,
  summary: row.summary,
  person: personLink(row),
  orgId: row.org_id,
  orgName: row.org_name,
  dealId: row.deal_id,
  dealTitle: row.deal_title,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

async function loadInteraction(db: D1Database, id: number): Promise<Interaction> {
  const row = await db.prepare(`${INTERACTION_SELECT} WHERE i.id = ?`).bind(id).first<InteractionRow>()
  if (!row) throw new ApiError(404, 'That interaction no longer exists.')
  return toInteraction(row)
}

async function loadFollowUp(db: D1Database, id: number) {
  const row = await db.prepare(`${FOLLOW_UP_SELECT} WHERE f.id = ?`).bind(id).first<FollowUpRow>()
  if (!row) throw new ApiError(404, 'That follow-up no longer exists.')
  return toFollowUp(row)
}

/** WHERE parts for the ?personKey=, ?orgId= and ?dealId= filters every Activity list takes. */
function linkFilters(c: Context, alias: string): { where: string[]; values: (string | number)[] } {
  const where: string[] = []
  const values: (string | number)[] = []
  const person = personFilter(alias, c.req.query('personKey'))
  if (person) {
    where.push(person.sql)
    values.push(person.value)
  }
  const orgId = queryId(c.req.query('orgId'))
  if (orgId) {
    where.push(`${alias}.org_id = ?`)
    values.push(orgId)
  }
  const dealId = queryId(c.req.query('dealId'))
  if (dealId) {
    where.push(`${alias}.deal_id = ?`)
    values.push(dealId)
  }
  return { where, values }
}

app.get('/api/admin/interactions', async (c) => {
  const { where, values } = linkFilters(c, 'i')
  const { results } = await c.env.DB.prepare(
    `${INTERACTION_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY i.happened_on DESC, i.id DESC LIMIT 200`,
  )
    .bind(...values)
    .all<InteractionRow>()
  return c.json({ items: results.map(toInteraction) })
})

// The interaction and its next step go in together: one batch is one transaction in D1, so a
// follow-up never exists without the interaction it came from.
app.post('/api/admin/interactions', async (c) => {
  const input = await readBody(c, interactionInput)
  const db = c.env.DB
  const links = await resolveLinks(db, input)
  const me = c.var.admin.email
  const insert = db
    .prepare(
      `INSERT INTO interactions (kind, happened_on, summary, member_id, contact_id, org_id, deal_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.kind, input.happenedOn, input.summary, links.memberId, links.contactId, links.orgId, links.dealId, me)
  const statements = [insert]
  if (input.followUp) {
    statements.push(
      db
        .prepare(
          `INSERT INTO follow_ups (title, due_on, owner_email, member_id, contact_id, org_id, deal_id, interaction_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, last_insert_rowid(), ?) RETURNING id`,
        )
        .bind(input.followUp.title, input.followUp.dueOn, input.followUp.ownerEmail, links.memberId, links.contactId, links.orgId, links.dealId, me),
    )
  }
  const [made, next] = await db.batch<{ id: number }>(statements)
  const id = made.results[0]?.id
  if (!id) throw new ApiError(500, 'Could not save the interaction.')
  const followUpId = next?.results[0]?.id
  return c.json({ item: await loadInteraction(db, id), followUp: followUpId ? await loadFollowUp(db, followUpId) : null }, 201)
})

// What it was and who it was with can change; a next step is a follow-up of its own.
const interactionPatch = interactionInput.omit({ followUp: true }).partial()

app.patch('/api/admin/interactions/:id', async (c) => {
  const id = idParam(c)
  const db = c.env.DB
  const existing = await db
    .prepare('SELECT created_by, member_id, contact_id, org_id, deal_id FROM interactions WHERE id = ?')
    .bind(id)
    .first<{ created_by: string; member_id: number | null; contact_id: number | null; org_id: number | null; deal_id: number | null }>()
  if (!existing) throw new ApiError(404, 'That interaction no longer exists.')
  requireAuthor(c, existing.created_by)
  const input = await readPatch(c, interactionPatch)
  const sets: string[] = []
  const values: unknown[] = []
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = ?`)
    values.push(value)
  }
  if (input.kind !== undefined) set('kind', input.kind)
  if (input.happenedOn !== undefined) set('happened_on', input.happenedOn)
  if (input.summary !== undefined) set('summary', input.summary)
  if (input.personKey !== undefined || input.orgId !== undefined || input.dealId !== undefined) {
    const current = existing.member_id ? `m${existing.member_id}` : existing.contact_id ? `c${existing.contact_id}` : null
    const links = await resolveLinks(db, {
      personKey: input.personKey !== undefined ? input.personKey : current,
      // A new person with no org given takes their own org, not the old person's.
      orgId: input.orgId !== undefined ? input.orgId : input.personKey !== undefined ? null : existing.org_id,
      dealId: input.dealId !== undefined ? input.dealId : existing.deal_id,
    })
    set('member_id', links.memberId)
    set('contact_id', links.contactId)
    set('org_id', links.orgId)
    set('deal_id', links.dealId)
  }
  await db
    .prepare(`UPDATE interactions SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()
  return c.json({ item: await loadInteraction(db, id) })
})

// A follow-up made from it stays (interaction_id is SET NULL).
app.delete('/api/admin/interactions/:id', async (c) => {
  const id = idParam(c)
  const existing = await c.env.DB.prepare('SELECT created_by FROM interactions WHERE id = ?').bind(id).first<{ created_by: string }>()
  if (!existing) return c.body(null, 204)
  requireAuthor(c, existing.created_by)
  await c.env.DB.prepare('DELETE FROM interactions WHERE id = ?').bind(id).run()
  return c.body(null, 204)
})

// ---- Follow-ups ---------------------------------------------------------------------------------

app.get('/api/admin/follow-ups', async (c) => {
  const { where, values } = linkFilters(c, 'f')
  if (c.req.query('open') === '1') where.push('f.done_at IS NULL')
  if (c.req.query('mine') === '1') {
    where.push('f.owner_email = ?')
    values.push(c.var.admin.email)
  }
  // Open ones first by due day, then the latest done; capped so years of ticked ones stay cheap.
  const { results } = await c.env.DB.prepare(
    `${FOLLOW_UP_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY f.done_at IS NOT NULL, f.due_on, f.done_at DESC LIMIT 300`,
  )
    .bind(...values)
    .all<FollowUpRow>()
  return c.json({ items: results.map(toFollowUp).sort(compareFollowUps) })
})

app.post('/api/admin/follow-ups', async (c) => {
  const input = await readBody(c, followUpInput)
  const db = c.env.DB
  const links = await resolveLinks(db, input, false)
  const row = await db
    .prepare(
      `INSERT INTO follow_ups (title, due_on, owner_email, member_id, contact_id, org_id, deal_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.title, input.dueOn, input.ownerEmail, links.memberId, links.contactId, links.orgId, links.dealId, c.var.admin.email)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the follow-up.')
  return c.json({ item: await loadFollowUp(db, row.id) }, 201)
})

// Anyone can tick off or move a follow-up: it's shared work, and whoever does the thing marks it.
app.patch('/api/admin/follow-ups/:id', async (c) => {
  const id = idParam(c)
  const input = await readPatch(c, followUpPatch)
  const sets: string[] = []
  const values: unknown[] = []
  if (input.title !== undefined) {
    sets.push('title = ?')
    values.push(input.title)
  }
  if (input.dueOn !== undefined) {
    sets.push('due_on = ?')
    values.push(input.dueOn)
  }
  if (input.ownerEmail !== undefined) {
    sets.push('owner_email = ?')
    values.push(input.ownerEmail)
  }
  if (input.done !== undefined) sets.push(input.done ? "done_at = COALESCE(done_at, datetime('now'))" : 'done_at = NULL')
  const result = await c.env.DB.prepare(`UPDATE follow_ups SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()
  if (!result.meta.changes) throw new ApiError(404, 'That follow-up no longer exists.')
  return c.json({ item: await loadFollowUp(c.env.DB, id) })
})

app.delete('/api/admin/follow-ups/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM follow_ups WHERE id = ?').bind(idParam(c)).run()
  return c.body(null, 204)
})

// ---- Intros -------------------------------------------------------------------------------------

interface IntroRow {
  id: number
  member_id: number | null
  member_name: string | null
  lead_id: number | null
  lead_name: string | null
  lead_org_name: string | null
  contact_id: number
  contact_name: string
  contact_org_name: string | null
  reason: string
  status: IntroStatus
  outcome: string
  made_by: string
  created_at: string
  updated_at: string
}

const INTRO_SELECT = `
  SELECT i.*, m.name AS member_name, l.name AS lead_name, lo.name AS lead_org_name, ct.name AS contact_name, co.name AS contact_org_name
  FROM intros i
  LEFT JOIN members m ON m.id = i.member_id
  LEFT JOIN contacts l ON l.id = i.lead_id
  LEFT JOIN orgs lo ON lo.id = l.org_id
  JOIN contacts ct ON ct.id = i.contact_id
  LEFT JOIN orgs co ON co.id = ct.org_id`

const nobody = { member_id: null, member_name: null, contact_id: null, contact_name: null, contact_org_name: null }

const toIntro = (row: IntroRow): Intro => ({
  id: row.id,
  // A student is a member or a lead (a contact of kind lead); exactly one is set (see the CHECK).
  student: personLink(
    row.member_id !== null
      ? { ...nobody, member_id: row.member_id, member_name: row.member_name }
      : { ...nobody, contact_id: row.lead_id, contact_name: row.lead_name, contact_org_name: row.lead_org_name },
  ) ?? { key: '', name: 'Removed', orgName: null },
  contact: { key: `c${row.contact_id}`, name: row.contact_name, orgName: row.contact_org_name },
  reason: row.reason,
  status: row.status,
  outcome: row.outcome,
  madeBy: row.made_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

async function loadIntro(db: D1Database, id: number): Promise<Intro> {
  const row = await db.prepare(`${INTRO_SELECT} WHERE i.id = ?`).bind(id).first<IntroRow>()
  if (!row) throw new ApiError(404, 'That intro no longer exists.')
  return toIntro(row)
}

app.get('/api/admin/intros', async (c) => {
  const where: string[] = []
  const values: number[] = []
  const ref = parsePersonKey(c.req.query('personKey') ?? '')
  // Either side: a member is only ever the student; a contact can be a lead (student) or the contact.
  if (ref?.type === 'member') {
    where.push('i.member_id = ?')
    values.push(ref.id)
  } else if (ref) {
    where.push('(i.lead_id = ? OR i.contact_id = ?)')
    values.push(ref.id, ref.id)
  }
  const orgId = queryId(c.req.query('orgId'))
  if (orgId) {
    where.push('ct.org_id = ?')
    values.push(orgId)
  }
  const { results } = await c.env.DB.prepare(
    `${INTRO_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY i.created_at DESC, i.id DESC LIMIT 300`,
  )
    .bind(...values)
    .all<IntroRow>()
  return c.json({ items: results.map(toIntro) })
})

app.post('/api/admin/intros', async (c) => {
  const input = await readBody(c, introInput)
  const db = c.env.DB
  const student = await findPerson(db, input.studentKey, 'studentKey')
  if (student.kind !== 'member' && student.kind !== 'lead') {
    throw new ApiError(400, 'Check the highlighted fields.', { studentKey: 'Pick a member or a lead.' })
  }
  const contact = await findPerson(db, input.contactKey, 'contactKey')
  if (contact.ref.type !== 'contact') throw new ApiError(400, 'Check the highlighted fields.', { contactKey: 'Pick a contact, not a member.' })
  if (input.studentKey === input.contactKey) throw new ApiError(400, 'Check the highlighted fields.', { contactKey: 'Pick someone other than the student.' })
  const row = await db
    .prepare('INSERT INTO intros (member_id, lead_id, contact_id, reason, status, made_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(
      student.ref.type === 'member' ? student.ref.id : null,
      student.ref.type === 'contact' ? student.ref.id : null,
      contact.ref.id,
      input.reason,
      input.status,
      c.var.admin.email,
    )
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the intro.')
  return c.json({ item: await loadIntro(db, row.id) }, 201)
})

app.patch('/api/admin/intros/:id', async (c) => {
  const id = idParam(c)
  const input = await readPatch(c, introPatch)
  const sets: string[] = []
  const values: string[] = []
  for (const [key, column] of [
    ['status', 'status'],
    ['reason', 'reason'],
    ['outcome', 'outcome'],
  ] as const) {
    const value = input[key]
    if (value !== undefined) {
      sets.push(`${column} = ?`)
      values.push(value)
    }
  }
  const result = await c.env.DB.prepare(`UPDATE intros SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...values, id)
    .run()
  if (!result.meta.changes) throw new ApiError(404, 'That intro no longer exists.')
  return c.json({ item: await loadIntro(c.env.DB, id) })
})

app.delete('/api/admin/intros/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM intros WHERE id = ?').bind(idParam(c)).run()
  return c.body(null, 204)
})

// ---- Event guests (Community) -----------------------------------------------------------------

interface GuestRow {
  id: number
  event_id: number
  contact_id: number
  contact_name: string
  contact_org_name: string | null
  role: GuestRole
  status: GuestStatus
  owner_email: string | null
}

const GUEST_SELECT = `
  SELECT g.id, g.event_id, g.contact_id, ct.name AS contact_name, co.name AS contact_org_name, g.role, g.status, g.owner_email
  FROM event_guests g
  JOIN contacts ct ON ct.id = g.contact_id
  LEFT JOIN orgs co ON co.id = ct.org_id`

const toGuest = (row: GuestRow): EventGuest => ({
  id: row.id,
  eventId: row.event_id,
  contact: { key: `c${row.contact_id}`, name: row.contact_name, orgName: row.contact_org_name },
  role: row.role,
  status: row.status,
  ownerEmail: row.owner_email,
})

async function loadGuest(db: D1Database, eventId: number, id: number): Promise<EventGuest> {
  const row = await db.prepare(`${GUEST_SELECT} WHERE g.id = ? AND g.event_id = ?`).bind(id, eventId).first<GuestRow>()
  if (!row) throw new ApiError(404, 'That guest is no longer on this event.')
  return toGuest(row)
}

app.get('/api/admin/events/:id/guests', async (c) => {
  const { results } = await c.env.DB.prepare(`${GUEST_SELECT} WHERE g.event_id = ? ORDER BY g.created_at, g.id`)
    .bind(idParam(c))
    .all<GuestRow>()
  return c.json({ items: results.map(toGuest) })
})

/**
 * The contact a member is a guest as: the one with their email (People folds it into them), or a
 * new one. Only for an invite-only event, which takes no RSVPs, so its guests are everyone coming.
 */
async function memberAsContact(db: D1Database, memberId: number, by: string): Promise<number> {
  const member = await db.prepare('SELECT name, email FROM members WHERE id = ?').bind(memberId).first<{ name: string; email: string }>()
  if (!member) throw new ApiError(400, 'Check the highlighted fields.', { contactKey: 'That person is no longer in People.' })
  const existing = await db.prepare('SELECT id FROM contacts WHERE email = ? ORDER BY id LIMIT 1').bind(member.email).first<{ id: number }>()
  if (existing) return existing.id
  const row = await db
    .prepare('INSERT INTO contacts (name, email, created_by) VALUES (?, ?, ?) RETURNING id')
    .bind(member.name, member.email, by)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not add the guest.')
  return row.id
}

app.post('/api/admin/events/:id/guests', async (c) => {
  requireGate(c, 'community')
  const eventId = idParam(c)
  const input = await readBody(c, eventGuestInput)
  const db = c.env.DB
  const event = await db.prepare('SELECT id, invite_only FROM events WHERE id = ?').bind(eventId).first<{ id: number; invite_only: number }>()
  if (!event) throw new ApiError(404, 'That event no longer exists.')
  const contact = await findPerson(db, input.contactKey, 'contactKey')
  let contactId: number
  if (contact.ref.type === 'contact') contactId = contact.ref.id
  else if (event.invite_only) contactId = await memberAsContact(db, contact.ref.id, c.var.admin.email)
  else throw new ApiError(400, 'Check the highlighted fields.', { contactKey: 'Pick a contact. Members come as RSVPs.' })
  const clash = await db.prepare('SELECT 1 FROM event_guests WHERE event_id = ? AND contact_id = ?').bind(eventId, contactId).first()
  if (clash) throw new ApiError(409, `${contact.name} is already a guest.`, { contactKey: 'Already a guest' })
  const row = await db
    .prepare('INSERT INTO event_guests (event_id, contact_id, role, status, owner_email) VALUES (?, ?, ?, ?, ?) RETURNING id')
    // Whoever looks after the contact looks after them at the event, unless someone's named.
    .bind(eventId, contactId, input.role, input.status, input.ownerEmail ?? contact.ownerEmail ?? c.var.admin.email)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not add the guest.')
  return c.json({ item: await loadGuest(db, eventId, row.id) }, 201)
})

app.patch('/api/admin/events/:id/guests/:guestId', async (c) => {
  requireGate(c, 'community')
  const eventId = idParam(c)
  const id = idParam(c, 'guestId')
  const input = await readPatch(c, eventGuestPatch)
  const sets: string[] = []
  const values: (string | null)[] = []
  if (input.role !== undefined) {
    sets.push('role = ?')
    values.push(input.role)
  }
  if (input.status !== undefined) {
    sets.push('status = ?')
    values.push(input.status)
  }
  if (input.ownerEmail !== undefined) {
    sets.push('owner_email = ?')
    values.push(input.ownerEmail)
  }
  const result = await c.env.DB.prepare(`UPDATE event_guests SET ${sets.join(', ')} WHERE id = ? AND event_id = ?`)
    .bind(...values, id, eventId)
    .run()
  if (!result.meta.changes) throw new ApiError(404, 'That guest is no longer on this event.')
  return c.json({ item: await loadGuest(c.env.DB, eventId, id) })
})

app.delete('/api/admin/events/:id/guests/:guestId', async (c) => {
  requireGate(c, 'community')
  await c.env.DB.prepare('DELETE FROM event_guests WHERE id = ? AND event_id = ?').bind(idParam(c, 'guestId'), idParam(c)).run()
  return c.body(null, 204)
})

export default app
