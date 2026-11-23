import { Hono } from 'hono'
import {
  DEAL_STAGE_LABELS,
  DEAL_TYPES,
  INTERACTION_KIND_LABELS,
  dealInput,
  dealPatch,
  parsePersonKey,
  type Deal,
  type DealDetail,
  type DealStage,
  type DealType,
  type FollowUp,
  type InteractionKind,
} from '../../shared/api'
import { requireGate } from '../lib/access'
import { FOLLOW_UP_SELECT, readPatch, toFollowUp, type FollowUpRow } from '../lib/crmQueries'
import { compareDeals, compareFollowUps, dealTimeline, personLink, type PersonColumns } from '../lib/crmRows'
import { ApiError, idParam, readBody } from '../lib/http'
import type { AppEnv } from '../types'

// Deals: /api/admin/deals*. Every write needs Partnerships.
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

interface DealRow extends PersonColumns {
  id: number
  org_id: number
  org_name: string
  type: DealType
  title: string
  ask: string
  amount_cents: number | null
  stage: DealStage
  passed_at: string | null
  event_id: number | null
  event_title: string | null
  notes: string
  owner_email: string | null
  /** JSON from the subquery below: the deal's earliest open follow-up. */
  next_follow_up: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// A deal's contact is always a contact (deals.contact_id), so the member columns are NULL; they're
// selected anyway so the row reads as PersonColumns.
const DEAL_SELECT = `
  SELECT d.*, o.name AS org_name, e.title AS event_title,
    NULL AS member_id, NULL AS member_name, ct.name AS contact_name, cto.name AS contact_org_name,
    (SELECT json_object('id', f.id, 'title', f.title, 'dueOn', f.due_on) FROM follow_ups f
      WHERE f.deal_id = d.id AND f.done_at IS NULL ORDER BY f.due_on, f.id LIMIT 1) AS next_follow_up
  FROM deals d
  JOIN orgs o ON o.id = d.org_id
  LEFT JOIN contacts ct ON ct.id = d.contact_id
  LEFT JOIN orgs cto ON cto.id = ct.org_id
  LEFT JOIN events e ON e.id = d.event_id`

const toDeal = (row: DealRow): Deal => ({
  id: row.id,
  orgId: row.org_id,
  orgName: row.org_name,
  contact: personLink(row),
  type: row.type,
  title: row.title,
  ask: row.ask,
  amountCents: row.amount_cents,
  stage: row.stage,
  passedAt: row.passed_at,
  eventId: row.event_id,
  eventTitle: row.event_title,
  notes: row.notes,
  ownerEmail: row.owner_email,
  nextFollowUp: row.next_follow_up ? (JSON.parse(row.next_follow_up) as Deal['nextFollowUp']) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

interface HistoryRow extends PersonColumns {
  kind: InteractionKind
  happened_on: string
  summary: string
  created_by: string
  created_at: string
}

async function loadDeal(db: D1Database, id: number): Promise<DealDetail> {
  const [dealRows, interactionRows, followUpRows] = await db.batch([
    db.prepare(`${DEAL_SELECT} WHERE d.id = ?`).bind(id),
    db
      .prepare(
        `SELECT i.kind, i.happened_on, i.summary, i.created_by, i.created_at, i.member_id, m.name AS member_name, i.contact_id,
           ct.name AS contact_name, co.name AS contact_org_name
         FROM interactions i
         LEFT JOIN members m ON m.id = i.member_id
         LEFT JOIN contacts ct ON ct.id = i.contact_id
         LEFT JOIN orgs co ON co.id = ct.org_id
         WHERE i.deal_id = ? ORDER BY i.happened_on DESC, i.id DESC LIMIT 200`,
      )
      .bind(id),
    db.prepare(`${FOLLOW_UP_SELECT} WHERE f.deal_id = ?`).bind(id),
  ])
  const row = (dealRows.results as DealRow[])[0]
  if (!row) throw new ApiError(404, 'That deal no longer exists.')
  const deal = toDeal(row)
  const followUps: FollowUp[] = (followUpRows.results as FollowUpRow[]).map(toFollowUp).sort(compareFollowUps)
  const timeline = dealTimeline({
    deal: {
      stageLabel: DEAL_STAGE_LABELS[deal.stage],
      ask: deal.ask,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      createdBy: row.created_by,
      passedAt: deal.passedAt,
    },
    interactions: (interactionRows.results as HistoryRow[]).map((item) => ({
      label: INTERACTION_KIND_LABELS[item.kind],
      person: personLink(item),
      summary: item.summary,
      happenedOn: item.happened_on,
      createdBy: item.created_by,
      createdAt: item.created_at,
    })),
    followUps,
  })
  return { ...deal, timeline, followUps }
}

/** The contact a deal names must be a contact (deals.contact_id), not a member. */
async function contactIdFor(db: D1Database, key: string | null): Promise<number | null> {
  if (key === null) return null
  const ref = parsePersonKey(key)
  if (!ref || ref.type !== 'contact') throw new ApiError(400, 'Check the highlighted fields.', { contactKey: 'Pick a contact, not a member.' })
  const row = await db.prepare('SELECT id FROM contacts WHERE id = ?').bind(ref.id).first()
  if (!row) throw new ApiError(400, 'Check the highlighted fields.', { contactKey: 'That contact no longer exists.' })
  return ref.id
}

async function checkEvent(db: D1Database, eventId: number | null): Promise<void> {
  if (eventId === null) return
  const row = await db.prepare('SELECT id FROM events WHERE id = ?').bind(eventId).first()
  if (!row) throw new ApiError(400, 'Check the highlighted fields.', { eventId: 'That event no longer exists.' })
}

const isType = (value: string | undefined): value is DealType => (DEAL_TYPES as readonly string[]).includes(value ?? '')

// passed=1 lists only the passed deals (the board's "show passed"); without it, only live ones.
app.get('/api/admin/deals', async (c) => {
  const where = [c.req.query('passed') === '1' ? 'd.passed_at IS NOT NULL' : 'd.passed_at IS NULL']
  const values: string[] = []
  const type = c.req.query('type')
  if (isType(type)) {
    where.push('d.type = ?')
    values.push(type)
  }
  if (c.req.query('mine') === '1') {
    where.push('d.owner_email = ?')
    values.push(c.var.admin.email)
  }
  const { results } = await c.env.DB.prepare(`${DEAL_SELECT} WHERE ${where.join(' AND ')} LIMIT 500`)
    .bind(...values)
    .all<DealRow>()
  return c.json({ items: results.map(toDeal).sort(compareDeals) })
})

app.get('/api/admin/deals/:id', async (c) => c.json({ item: await loadDeal(c.env.DB, idParam(c)) }))

app.post('/api/admin/deals', async (c) => {
  requireGate(c, 'partnerships')
  const input = await readBody(c, dealInput)
  const db = c.env.DB
  const org = await db.prepare('SELECT id FROM orgs WHERE id = ?').bind(input.orgId).first()
  if (!org) throw new ApiError(400, 'Check the highlighted fields.', { orgId: 'That org no longer exists.' })
  const contactId = await contactIdFor(db, input.contactKey)
  await checkEvent(db, input.eventId)
  const row = await db
    .prepare(
      `INSERT INTO deals (org_id, contact_id, type, title, ask, amount_cents, stage, event_id, notes, owner_email, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.orgId,
      contactId,
      input.type,
      input.title,
      input.ask,
      input.amountCents,
      input.stage,
      input.eventId,
      input.notes,
      input.ownerEmail,
      c.var.admin.email,
    )
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the deal.')
  return c.json({ item: await loadDeal(db, row.id) }, 201)
})

app.patch('/api/admin/deals/:id', async (c) => {
  requireGate(c, 'partnerships')
  const id = idParam(c)
  const input = await readPatch(c, dealPatch)
  const db = c.env.DB
  const sets: string[] = []
  const values: unknown[] = []
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = ?`)
    values.push(value)
  }
  if (input.contactKey !== undefined) set('contact_id', await contactIdFor(db, input.contactKey))
  if (input.eventId !== undefined) {
    await checkEvent(db, input.eventId)
    set('event_id', input.eventId)
  }
  if (input.type !== undefined) set('type', input.type)
  if (input.title !== undefined) set('title', input.title)
  if (input.ask !== undefined) set('ask', input.ask)
  if (input.amountCents !== undefined) set('amount_cents', input.amountCents)
  if (input.stage !== undefined) set('stage', input.stage)
  if (input.notes !== undefined) set('notes', input.notes)
  if (input.ownerEmail !== undefined) set('owner_email', input.ownerEmail)
  // Passing keeps the stage, so a deal brought back returns to where it was.
  if (input.passed !== undefined) sets.push(input.passed ? "passed_at = COALESCE(passed_at, datetime('now'))" : 'passed_at = NULL')
  const result = await db
    .prepare(`UPDATE deals SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...values, id)
    .run()
  if (!result.meta.changes) throw new ApiError(404, 'That deal no longer exists.')
  return c.json({ item: await loadDeal(db, id) })
})

// Its follow-ups go with it (ON DELETE CASCADE); interactions logged on it stay, unlinked.
app.delete('/api/admin/deals/:id', async (c) => {
  requireGate(c, 'partnerships')
  await c.env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(idParam(c)).run()
  return c.body(null, 204)
})

export default app
