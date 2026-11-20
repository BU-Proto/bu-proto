import { Hono } from 'hono'
import { z } from 'zod'
import {
  DEAL_STAGE_LABELS,
  DEAL_TYPE_LABELS,
  INTERACTION_KIND_LABELS,
  INTRO_STATUS_LABELS,
  QUEUE_SOURCES,
  personKey,
  type DealStage,
  type DealType,
  type FollowUp,
  type InteractionKind,
  type IntroStatus,
  type PersonLink,
  type QueueItem,
  type QueueSource,
  type TimelineItem,
  type Today,
} from '../../shared/crm'
import type { ApplicationStatus, FundStatus } from '../../shared/api'
import { bostonToday } from '../lib/dates'
import { ApiError, idParam, parseInput } from '../lib/http'
import { listThreads } from '../lib/inbox'
import { WAITING_WHERE, waitingCounts } from '../lib/queue'
import { addDays, newestFirst, snippet, soonest } from '../lib/today'
import type { AppEnv } from '../types'

// Today and the Inbox's queue: /api/admin/today, /api/admin/queue*. Shared work.
// The contract is in shared/crm.ts.

const app = new Hono<AppEnv>()

/** How far back the Inbox shows things that have already been dealt with, so it's never bare. */
const HANDLED_DAYS = 30
const handledSince = `datetime('now', '-${HANDLED_DAYS} days')`

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

// ---- Follow-ups -----------------------------------------------------------------------------------

interface FollowUpRow {
  id: number
  title: string
  due_on: string
  owner_email: string
  done_at: string | null
  member_id: number | null
  contact_id: number | null
  org_id: number | null
  deal_id: number | null
  created_by: string
  created_at: string
  member_name: string | null
  contact_name: string | null
  contact_org_name: string | null
  org_name: string | null
  deal_title: string | null
}

// The org shown beside a follow-up is its own, else its deal's, else its contact's: "Lumen Labs"
// reads better under "Ask about prize money" than nothing does.
const FOLLOW_UPS_SQL = `
  SELECT f.id, f.title, f.due_on, f.owner_email, f.done_at, f.member_id, f.contact_id,
         COALESCE(f.org_id, d.org_id, ct.org_id) AS org_id, f.deal_id, f.created_by, f.created_at,
         m.name AS member_name, ct.name AS contact_name, COALESCE(co.name, NULLIF(ct.organization, '')) AS contact_org_name,
         o.name AS org_name, d.title AS deal_title
  FROM follow_ups f
  LEFT JOIN members m ON m.id = f.member_id
  LEFT JOIN contacts ct ON ct.id = f.contact_id
  LEFT JOIN orgs co ON co.id = ct.org_id
  LEFT JOIN deals d ON d.id = f.deal_id
  LEFT JOIN orgs o ON o.id = COALESCE(f.org_id, d.org_id, ct.org_id)
  WHERE f.done_at IS NULL AND f.due_on <= ?
  ORDER BY f.due_on, f.id`

function toFollowUp(row: FollowUpRow): FollowUp {
  let person: PersonLink | null = null
  if (row.member_id && row.member_name !== null) person = { key: personKey({ type: 'member', id: row.member_id }), name: row.member_name, orgName: null }
  else if (row.contact_id && row.contact_name !== null)
    person = { key: personKey({ type: 'contact', id: row.contact_id }), name: row.contact_name, orgName: row.contact_org_name }
  return {
    id: row.id,
    title: row.title,
    dueOn: row.due_on,
    ownerEmail: row.owner_email,
    doneAt: row.done_at,
    person,
    orgId: row.org_id,
    orgName: row.org_name,
    dealId: row.deal_id,
    dealTitle: row.deal_title,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

// ---- Recent activity ------------------------------------------------------------------------------

interface InteractionRow {
  id: number
  kind: InteractionKind
  summary: string
  member_id: number | null
  contact_id: number | null
  org_id: number | null
  deal_id: number | null
  created_by: string
  created_at: string
  member_name: string | null
  contact_name: string | null
  org_name: string | null
}

interface DealRow {
  id: number
  title: string
  type: DealType
  stage: DealStage
  passed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  org_name: string
}

interface MemberRow {
  id: number
  name: string
  year: string
  track: string
  created_at: string
}

interface WinRow {
  id: number
  project: string
  event: string
  placement: string
  created_at: string
}

interface IntroRow {
  id: number
  status: IntroStatus
  reason: string
  made_by: string
  updated_at: string
  student_name: string | null
  contact_name: string
}

function interactionItem(row: InteractionRow): TimelineItem {
  const label = INTERACTION_KIND_LABELS[row.kind]
  const who = row.member_name ?? row.contact_name
  const withWhom = who ? `${who}${row.org_name ? ` at ${row.org_name}` : ''}` : row.org_name
  const title = !withWhom ? label : row.kind === 'note' ? `Note on ${withWhom}` : `${label} with ${withWhom}`
  const href = row.member_id
    ? `/admin/people/${personKey({ type: 'member', id: row.member_id })}`
    : row.contact_id
      ? `/admin/people/${personKey({ type: 'contact', id: row.contact_id })}`
      : row.org_id
        ? `/admin/orgs/${row.org_id}`
        : row.deal_id
          ? `/admin/pipeline/${row.deal_id}`
          : null
  return { kind: 'interaction', label, title, detail: snippet(row.summary, 140), at: row.created_at, href, by: row.created_by }
}

function dealItem(row: DealRow): TimelineItem {
  // A deal touched more than a minute after it was made has moved since; otherwise it's new.
  const moved = Date.parse(`${row.updated_at.replace(' ', 'T')}Z`) - Date.parse(`${row.created_at.replace(' ', 'T')}Z`) > 60_000
  const title = !moved
    ? `${row.title} added to the pipeline`
    : row.passed_at
      ? `${row.title} passed`
      : `${row.title} moved to ${DEAL_STAGE_LABELS[row.stage]}`
  return {
    kind: 'deal',
    label: 'Deal',
    title,
    detail: `${row.org_name} · ${DEAL_TYPE_LABELS[row.type]}`,
    at: moved ? row.updated_at : row.created_at,
    href: `/admin/pipeline/${row.id}`,
    by: moved ? null : row.created_by,
  }
}

const memberItem = (row: MemberRow): TimelineItem => ({
  kind: 'joined',
  label: 'Sign-up',
  title: `${row.name} signed up`,
  detail: `${row.track}, ${row.year.toLowerCase()}`,
  at: row.created_at,
  href: `/admin/people/${personKey({ type: 'member', id: row.id })}`,
  by: null,
})

const winItem = (row: WinRow): TimelineItem => ({
  kind: 'win',
  label: 'Win',
  title: `${row.project}: ${row.placement} at ${row.event}`,
  detail: '',
  at: row.created_at,
  href: `/admin/wins/${row.id}`,
  by: null,
})

const introItem = (row: IntroRow): TimelineItem => ({
  kind: 'intro',
  label: 'Intro',
  title: `${row.student_name ?? 'A student'} to ${row.contact_name}`,
  detail: [INTRO_STATUS_LABELS[row.status], row.reason].filter(Boolean).join(' · '),
  at: row.updated_at,
  href: '/admin/activity/intros',
  by: row.made_by,
})

// ---- Upcoming -------------------------------------------------------------------------------------

interface EventRow {
  id: number
  title: string
  date: string
  time: string
  kind: string
  register_url: string | null
  rsvps: number
}

interface HackathonRow {
  id: number
  name: string
  apply_by: string
  location: string
}

type Upcoming = Today['upcoming'][number]

// ---- GET /api/admin/today --------------------------------------------------------------------------

app.get('/api/admin/today', async (c) => {
  const db = c.env.DB
  const today = bostonToday()
  const recent = 10
  const [followUps, events, hackathons, interactions, deals, members, wins, intros, openDeals] = await db.batch<unknown>([
    db.prepare(FOLLOW_UPS_SQL).bind(addDays(today, 7)),
    db
      .prepare(
        `SELECT e.id, e.title, e.date, e.time, e.kind, e.register_url, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) AS rsvps
         FROM events e WHERE e.published = 1 AND e.date >= ? ORDER BY e.date, e.id LIMIT 40`,
      )
      .bind(today),
    db.prepare('SELECT id, name, apply_by, location FROM hackathons WHERE published = 1 AND apply_by >= ? ORDER BY apply_by, id LIMIT 40').bind(today),
    db.prepare(
      `SELECT i.id, i.kind, i.summary, i.member_id, i.contact_id, i.org_id, i.deal_id, i.created_by, i.created_at,
              m.name AS member_name, ct.name AS contact_name, o.name AS org_name
       FROM interactions i
       LEFT JOIN members m ON m.id = i.member_id
       LEFT JOIN contacts ct ON ct.id = i.contact_id
       LEFT JOIN orgs o ON o.id = i.org_id
       ORDER BY i.created_at DESC, i.id DESC LIMIT ${recent}`,
    ),
    db.prepare(
      `SELECT d.id, d.title, d.type, d.stage, d.passed_at, d.created_by, d.created_at, d.updated_at, o.name AS org_name
       FROM deals d JOIN orgs o ON o.id = d.org_id ORDER BY d.updated_at DESC, d.id DESC LIMIT ${recent}`,
    ),
    db.prepare(`SELECT id, name, year, track, created_at FROM members ORDER BY created_at DESC, id DESC LIMIT ${recent}`),
    // Samples aren't news.
    db.prepare(`SELECT id, project, event, placement, created_at FROM wins WHERE placeholder = 0 ORDER BY created_at DESC, id DESC LIMIT ${recent}`),
    db.prepare(
      `SELECT n.id, n.status, n.reason, n.made_by, n.updated_at, COALESCE(m.name, l.name) AS student_name, c.name AS contact_name
       FROM intros n
       LEFT JOIN members m ON m.id = n.member_id
       LEFT JOIN contacts l ON l.id = n.lead_id
       JOIN contacts c ON c.id = n.contact_id
       ORDER BY n.updated_at DESC, n.id DESC LIMIT ${recent}`,
    ),
    db.prepare("SELECT COUNT(*) AS count FROM deals WHERE passed_at IS NULL AND stage != 'delivered'"),
  ])

  const upcoming: Upcoming[] = soonest(
    [
      ...(events.results as EventRow[]).map((row) => ({
        kind: 'event' as const,
        id: row.id,
        title: row.title,
        date: row.date,
        detail: [row.kind, row.time, row.register_url ? 'Sign-up on its own page' : plural(row.rsvps, 'RSVP')].filter(Boolean).join(' · '),
        href: `/admin/events/${row.id}`,
      })),
      ...(hackathons.results as HackathonRow[]).map((row) => ({
        kind: 'hackathon' as const,
        id: row.id,
        title: row.name,
        date: row.apply_by,
        detail: ['Applications close', row.location].filter(Boolean).join(' · '),
        href: `/admin/hackathons/${row.id}`,
      })),
    ],
    today,
  )

  const activity = newestFirst(
    [
      ...(interactions.results as InteractionRow[]).map(interactionItem),
      ...(deals.results as DealRow[]).map(dealItem),
      ...(members.results as MemberRow[]).map(memberItem),
      ...(wins.results as WinRow[]).map(winItem),
      ...(intros.results as IntroRow[]).map(introItem),
    ],
    recent,
  )

  const body: Today = {
    followUps: (followUps.results as FollowUpRow[]).map(toFollowUp),
    waiting: await waitingCounts(db),
    upcoming,
    activity,
    openDeals: (openDeals.results[0] as { count: number } | undefined)?.count ?? 0,
  }
  return c.json(body)
})

// ---- GET /api/admin/queue ----------------------------------------------------------------------------

const isSource = (value: string | undefined): value is QueueSource => (QUEUE_SOURCES as readonly string[]).includes(value ?? '')

type Draft = Omit<QueueItem, 'personKey'> & { personKey?: string | null }

async function emailItems(db: D1Database, waitingOnly: boolean): Promise<Draft[]> {
  const since = Date.now() - HANDLED_DAYS * 86_400_000
  const threads = await listThreads(db, waitingOnly ? 'open' : 'all')
  return threads
    .filter((thread) => thread.status === 'open' || Date.parse(`${thread.lastMessageAt.replace(' ', 'T')}Z`) >= since)
    .map((thread) => {
      const latest = thread.latest
      // Claude's reading says what an email wants better than its first line does.
      const line =
        latest?.direction === 'in' && latest.reading ? latest.reading.summary : `${latest?.direction === 'out' ? 'You: ' : ''}${snippet(latest?.snippet ?? '')}`
      return {
        source: 'email' as const,
        id: thread.id,
        name: thread.withName || thread.withEmail || 'Unknown',
        email: thread.withEmail,
        title: thread.subject || '(no subject)',
        snippet: line,
        at: thread.lastMessageAt,
        waiting: thread.status === 'open',
        href: `/admin/email/inbox/${thread.id}`,
      }
    })
}

async function signupItems(db: D1Database, waitingOnly: boolean): Promise<Draft[]> {
  const where = waitingOnly ? WAITING_WHERE.signup : `${WAITING_WHERE.signup} OR created_at >= ${handledSince}`
  const { results } = await db
    .prepare(`SELECT id, name, email, year, track, notes, created_at, reviewed_at FROM members WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT 200`)
    .all<MemberRow & { email: string; notes: string; reviewed_at: string | null }>()
  return results.map((row) => {
    const key = personKey({ type: 'member', id: row.id })
    return {
      source: 'signup' as const,
      id: row.id,
      name: row.name,
      email: row.email,
      title: `${row.year}, ${row.track}`,
      snippet: snippet(row.notes),
      at: row.created_at,
      waiting: row.reviewed_at === null,
      href: `/admin/people/${key}`,
      personKey: key,
    }
  })
}

async function fundItems(db: D1Database, waitingOnly: boolean): Promise<Draft[]> {
  const where = waitingOnly ? WAITING_WHERE.fund : `${WAITING_WHERE.fund} OR updated_at >= ${handledSince}`
  const { results } = await db
    .prepare(`SELECT id, name, email, target, spend, amount, status, created_at FROM fund_interest WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT 200`)
    .all<{ id: number; name: string; email: string; target: string; spend: string; amount: string; status: FundStatus; created_at: string }>()
  return results.map((row) => ({
    source: 'fund' as const,
    id: row.id,
    name: row.name,
    email: row.email,
    title: `${row.amount} for ${row.target}`,
    snippet: snippet(row.spend),
    at: row.created_at,
    waiting: row.status === 'new' || row.status === 'reviewing',
    href: '/admin/fund',
  }))
}

async function applicationItems(db: D1Database, waitingOnly: boolean): Promise<Draft[]> {
  const where = waitingOnly ? WAITING_WHERE.application : `${WAITING_WHERE.application} OR updated_at >= ${handledSince}`
  const { results } = await db
    .prepare(
      `SELECT id, role_title, name, email, year, link, resume_size, status, created_at FROM role_applications WHERE ${where}
       ORDER BY created_at DESC, id DESC LIMIT 200`,
    )
    .all<{ id: number; role_title: string; name: string; email: string; year: string; link: string; resume_size: number; status: ApplicationStatus; created_at: string }>()
  return results.map((row) => ({
    source: 'application' as const,
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.role_title,
    snippet: [row.year, row.resume_size > 0 ? 'Résumé attached' : '', row.link].filter(Boolean).join(' · '),
    at: row.created_at,
    waiting: row.status === 'new',
    href: '/admin/roles/applications',
  }))
}

async function boardItems(db: D1Database, waitingOnly: boolean): Promise<Draft[]> {
  const where = waitingOnly ? WAITING_WHERE.board : `${WAITING_WHERE.board} OR created_at >= ${handledSince} OR reviewed_at >= ${handledSince}`
  const { results } = await db
    .prepare(`SELECT id, name, email, year, role, note, created_at, reviewed_at FROM board_interest WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT 200`)
    .all<{ id: number; name: string; email: string; year: string; role: string; note: string; created_at: string; reviewed_at: string | null }>()
  return results.map((row) => ({
    source: 'board' as const,
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.role,
    snippet: snippet(row.note) || row.year,
    at: row.created_at,
    waiting: row.reviewed_at === null,
    href: '/admin/board/interest',
  }))
}

const LOADERS: Record<QueueSource, (db: D1Database, waitingOnly: boolean) => Promise<Draft[]>> = {
  email: emailItems,
  signup: signupItems,
  fund: fundItems,
  application: applicationItems,
  board: boardItems,
}

/**
 * The People key for each email that belongs to a member or a contact (members first: a student
 * who signed up is a member even if they were a lead before). D1 takes up to 100 values a
 * statement, so the emails go in batches.
 */
async function personKeysFor(db: D1Database, emails: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))]
  const keys = new Map<string, string>()
  if (unique.length === 0) return keys
  const statements: D1PreparedStatement[] = []
  for (let at = 0; at < unique.length; at += 90) {
    const chunk = unique.slice(at, at + 90)
    const marks = chunk.map(() => '?').join(', ')
    statements.push(db.prepare(`SELECT 'member' AS type, id, lower(email) AS email FROM members WHERE email IN (${marks})`).bind(...chunk))
    statements.push(db.prepare(`SELECT 'contact' AS type, id, lower(email) AS email FROM contacts WHERE email IN (${marks}) ORDER BY id`).bind(...chunk))
  }
  const results = await db.batch<{ type: 'member' | 'contact'; id: number; email: string }>(statements)
  const rows = results.flatMap((result) => result.results)
  for (const row of rows.filter((entry) => entry.type === 'member')) keys.set(row.email, personKey(row))
  for (const row of rows.filter((entry) => entry.type === 'contact')) if (!keys.has(row.email)) keys.set(row.email, personKey(row))
  return keys
}

app.get('/api/admin/queue', async (c) => {
  const db = c.env.DB
  const requested = c.req.query('source')
  const sources = isSource(requested) ? [requested] : [...QUEUE_SOURCES]
  const waitingOnly = c.req.query('waiting') === '1'
  const [lists, counts] = await Promise.all([Promise.all(sources.map((source) => LOADERS[source](db, waitingOnly))), waitingCounts(db)])
  const drafts = newestFirst(lists.flat(), 400)
  const keys = await personKeysFor(
    db,
    drafts.filter((item) => item.personKey === undefined).map((item) => item.email),
  )
  const items: QueueItem[] = drafts.map((item) => ({ ...item, personKey: item.personKey ?? keys.get(item.email.toLowerCase()) ?? null }))
  return c.json({ items, counts })
})

// ---- POST /api/admin/queue/:source/:id/review --------------------------------------------------------

// Only sign-ups and board interest are triaged here; the others have statuses of their own
// (a conversation's, a fund request's, an application's), changed where they live.
const REVIEWABLE: Partial<Record<QueueSource, string>> = { signup: 'members', board: 'board_interest' }
const reviewInput = z.object({ waiting: z.boolean().optional() }).default({})

app.post('/api/admin/queue/:source/:id/review', async (c) => {
  const source = c.req.param('source')
  const table = isSource(source) ? REVIEWABLE[source] : undefined
  if (!isSource(source)) throw new ApiError(404, 'Not found.')
  if (!table) throw new ApiError(400, 'That one has a status of its own. Change it where it lives.')
  const id = idParam(c)
  // The body is optional: an empty POST marks it seen.
  const raw: unknown = await c.req.json().catch(() => undefined)
  const { waiting } = parseInput(reviewInput, raw)
  const { meta } = await c.env.DB.prepare(`UPDATE ${table} SET reviewed_at = ${waiting ? 'NULL' : "datetime('now')"} WHERE id = ?`).bind(id).run()
  if (meta.changes === 0) throw new ApiError(404, 'That one no longer exists.')
  return c.json({ ok: true })
})

export default app
