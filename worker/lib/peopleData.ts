import {
  DEAL_STAGE_LABELS,
  DEAL_TYPE_LABELS,
  INTERACTION_KIND_LABELS,
  INTRO_STATUS_LABELS,
  ORG_KIND_LABELS,
  personKey,
  type ContactKind,
  type Deal,
  type DealStage,
  type DealType,
  type FollowUp,
  type GuestRole,
  type GuestStatus,
  type InteractionKind,
  type Intro,
  type IntroStatus,
  type Org,
  type OrgDetail,
  type OrgKind,
  type PersonDetail,
  type PersonLink,
  type PersonRef,
  type PersonSummary,
  type TimelineItem,
  type Wall,
} from '../../shared/crm'
import { ApiError } from './http'
import { clip, emailKey, foldContacts, inList, latestTouch, newestFirst, splitSummary, type Touch } from './people'

// Reading People and Orgs out of D1 for worker/routes/relationships.ts. Each list is built from
// a handful of whole-table queries (the tables hold hundreds of rows, not millions), joined up
// here, rather than a query per row.

// ---------------------------------------------------------------- rows

interface MemberRow {
  id: number
  name: string
  email: string
  year: string
  track: string
  notes: string
  unsubscribed: number
  owner_email: string | null
  created_at: string
}

interface ContactRow {
  id: number
  name: string
  email: string
  kind: ContactKind
  org_id: number | null
  org_name: string | null
  title: string
  notes: string
  link: string
  owner_email: string | null
  created_by: string
  created_at: string
}

interface TouchRow {
  /** m: a member id · c: a contact id · e: an email (orgs leave it out) */
  t: 'm' | 'c' | 'e'
  ref: string | number
  label: string
  at: string
}

interface NextRow {
  id: number
  title: string
  due_on: string
  member_id: number | null
  contact_id: number | null
}

const MEMBER_COLUMNS = 'id, name, email, year, track, notes, unsubscribed, owner_email, created_at'
const CONTACT_SELECT = `SELECT c.id, c.name, c.email, c.kind, c.org_id, o.name AS org_name, c.title, c.notes, c.link,
  c.owner_email, c.created_by, c.created_at FROM contacts c LEFT JOIN orgs o ON o.id = c.org_id`

/** What a touch's raw label (an interaction's kind, or a source) reads as. */
function touchLabel(label: string): string {
  if (label in INTERACTION_KIND_LABELS) return INTERACTION_KIND_LABELS[label as InteractionKind]
  return (
    { rsvp: 'RSVP', fund: 'Fund request', application: 'Applied', ask: 'Ask', email: 'Email', intro: 'Intro', deal: 'Deal' }[label] ??
    label
  )
}

// Every source of "something happened with them", newest per person. SQLite fills the bare
// column (an interaction's kind) from the row that holds the MAX, which is what's wanted here.
// Separate statements in one batch, since D1 allows only five terms in a compound SELECT.
const PERSON_TOUCHES = [
  "SELECT 'm' AS t, member_id AS ref, kind AS label, MAX(happened_on) AS at FROM interactions WHERE member_id IS NOT NULL GROUP BY member_id",
  "SELECT 'c' AS t, contact_id AS ref, kind AS label, MAX(happened_on) AS at FROM interactions WHERE contact_id IS NOT NULL GROUP BY contact_id",
  "SELECT 'e' AS t, lower(email) AS ref, 'rsvp' AS label, MAX(created_at) AS at FROM rsvps GROUP BY lower(email)",
  "SELECT 'e' AS t, lower(email) AS ref, 'fund' AS label, MAX(created_at) AS at FROM fund_interest GROUP BY lower(email)",
  "SELECT 'e' AS t, lower(email) AS ref, 'application' AS label, MAX(created_at) AS at FROM role_applications GROUP BY lower(email)",
  "SELECT 'c' AS t, contact_id AS ref, 'ask' AS label, MAX(COALESCE(sent_at, created_at)) AS at FROM asks WHERE contact_id IS NOT NULL GROUP BY contact_id",
  "SELECT 'e' AS t, lower(to_email) AS ref, 'ask' AS label, MAX(COALESCE(sent_at, created_at)) AS at FROM asks GROUP BY lower(to_email)",
  "SELECT 'c' AS t, contact_id AS ref, 'email' AS label, MAX(last_message_at) AS at FROM mail_threads WHERE contact_id IS NOT NULL GROUP BY contact_id",
  "SELECT 'm' AS t, member_id AS ref, 'intro' AS label, MAX(created_at) AS at FROM intros WHERE member_id IS NOT NULL GROUP BY member_id",
  "SELECT 'c' AS t, lead_id AS ref, 'intro' AS label, MAX(created_at) AS at FROM intros WHERE lead_id IS NOT NULL GROUP BY lead_id",
  "SELECT 'c' AS t, contact_id AS ref, 'intro' AS label, MAX(created_at) AS at FROM intros GROUP BY contact_id",
]

/** Each person's earliest open follow-up (SQLite fills id and title from the MIN row). */
const NEXT_FOLLOW_UPS = `SELECT id, title, MIN(due_on) AS due_on, member_id, contact_id FROM follow_ups
  WHERE done_at IS NULL AND (member_id IS NOT NULL OR contact_id IS NOT NULL) GROUP BY member_id, contact_id`

const touchKey = (t: string, ref: string | number) => `${t}:${typeof ref === 'string' ? ref.toLowerCase() : ref}`

// ---------------------------------------------------------------- people

/** Everyone in People, with what's needed to look one up again. */
export interface PeopleIndex {
  summaries: PersonSummary[]
  /** contact id → the member it folds into. */
  fold: Map<number, number>
  members: Map<number, MemberRow>
  contacts: Map<number, ContactRow>
}

export async function loadPeople(db: D1Database): Promise<PeopleIndex> {
  const [memberRows, contactRows, nextRows, ...touchResults] = await db.batch<MemberRow | ContactRow | TouchRow | NextRow>([
    db.prepare(`SELECT ${MEMBER_COLUMNS} FROM members`),
    db.prepare(CONTACT_SELECT),
    db.prepare(NEXT_FOLLOW_UPS),
    ...PERSON_TOUCHES.map((sql) => db.prepare(sql)),
  ])
  const members = memberRows.results as MemberRow[]
  const contacts = contactRows.results as ContactRow[]
  const fold = foldContacts(members, contacts)

  const touches = new Map<string, Touch[]>()
  for (const row of touchResults.flatMap((result) => result.results as TouchRow[])) {
    if (row.ref === null || !row.at) continue
    const key = touchKey(row.t, row.ref)
    const list = touches.get(key) ?? []
    list.push({ label: touchLabel(row.label), at: row.at })
    touches.set(key, list)
  }
  const nexts = new Map<string, NextRow>()
  for (const row of nextRows.results as NextRow[]) {
    nexts.set(row.member_id !== null ? `m:${row.member_id}` : `c:${row.contact_id}`, row)
  }
  const earliest = (keys: string[]) =>
    keys
      .map((key) => nexts.get(key))
      .filter((row): row is NextRow => Boolean(row))
      .sort((a, b) => a.due_on.localeCompare(b.due_on) || a.id - b.id)[0]
  const toNext = (row: NextRow | undefined) => (row ? { id: row.id, title: row.title, dueOn: row.due_on } : null)

  const foldedInto = new Map<number, ContactRow[]>()
  for (const contact of contacts) {
    const memberId = fold.get(contact.id)
    if (memberId !== undefined) foldedInto.set(memberId, [...(foldedInto.get(memberId) ?? []), contact])
  }

  const summaries: PersonSummary[] = []
  for (const member of members) {
    const extra = foldedInto.get(member.id) ?? []
    // A member who's also a contact at an org (a student who works at a startup) keeps that org.
    const atOrg = extra.find((contact) => contact.org_id !== null)
    const keys = [`m:${member.id}`, `e:${emailKey(member.email)}`, ...extra.map((contact) => `c:${contact.id}`)]
    summaries.push({
      key: personKey({ type: 'member', id: member.id }),
      type: 'member',
      id: member.id,
      name: member.name,
      email: member.email,
      kind: 'member',
      orgId: atOrg?.org_id ?? null,
      orgName: atOrg?.org_name ?? null,
      title: atOrg?.title ?? '',
      year: member.year,
      track: member.track,
      ownerEmail: member.owner_email ?? extra.find((contact) => contact.owner_email)?.owner_email ?? null,
      lastTouch: latestTouch([...keys.flatMap((key) => touches.get(key) ?? []), { label: 'Signed up', at: member.created_at }]),
      nextFollowUp: toNext(earliest(keys)),
      createdAt: member.created_at,
    })
  }
  for (const contact of contacts) {
    if (fold.has(contact.id)) continue
    const keys = [`c:${contact.id}`, `e:${emailKey(contact.email)}`]
    summaries.push({
      key: personKey({ type: 'contact', id: contact.id }),
      type: 'contact',
      id: contact.id,
      name: contact.name,
      email: contact.email,
      kind: contact.kind,
      orgId: contact.org_id,
      orgName: contact.org_name,
      title: contact.title,
      year: null,
      track: null,
      ownerEmail: contact.owner_email,
      lastTouch: latestTouch([...keys.flatMap((key) => touches.get(key) ?? []), { label: 'Added', at: contact.created_at }]),
      nextFollowUp: toNext(earliest(keys)),
      createdAt: contact.created_at,
    })
  }

  return {
    summaries,
    fold,
    members: new Map(members.map((row) => [row.id, row])),
    contacts: new Map(contacts.map((row) => [row.id, row])),
  }
}

/** How to name a member or contact next to something else, folded into the member when they're one. */
export function linker(index: PeopleIndex) {
  return (ref: PersonRef | null): PersonLink | null => {
    if (!ref) return null
    if (ref.type === 'contact') {
      const memberId = index.fold.get(ref.id)
      if (memberId !== undefined) return linker(index)({ type: 'member', id: memberId })
      const contact = index.contacts.get(ref.id)
      return contact ? { key: personKey(ref), name: contact.name, orgName: contact.org_name } : null
    }
    const member = index.members.get(ref.id)
    return member ? { key: personKey(ref), name: member.name, orgName: null } : null
  }
}

const memberRef = (id: number | null): PersonRef | null => (id === null ? null : { type: 'member', id })
const contactRef = (id: number | null): PersonRef | null => (id === null ? null : { type: 'contact', id })

// ---------------------------------------------------------------- follow-ups, intros, deals

interface FollowUpRow {
  id: number
  title: string
  due_on: string
  owner_email: string
  done_at: string | null
  member_id: number | null
  contact_id: number | null
  org_id: number | null
  org_name: string | null
  deal_id: number | null
  deal_title: string | null
  created_by: string
  created_at: string
}

const FOLLOW_UP_SELECT = `SELECT f.id, f.title, f.due_on, f.owner_email, f.done_at, f.member_id, f.contact_id, f.org_id,
  o.name AS org_name, f.deal_id, d.title AS deal_title, f.created_by, f.created_at
  FROM follow_ups f LEFT JOIN orgs o ON o.id = f.org_id LEFT JOIN deals d ON d.id = f.deal_id`

/** Open ones by due day, then the five most recently done. */
const FOLLOW_UP_ORDER = `ORDER BY f.done_at IS NOT NULL, CASE WHEN f.done_at IS NULL THEN f.due_on END, f.done_at DESC, f.id`

function toFollowUp(row: FollowUpRow, link: ReturnType<typeof linker>): FollowUp {
  return {
    id: row.id,
    title: row.title,
    dueOn: row.due_on,
    ownerEmail: row.owner_email,
    doneAt: row.done_at,
    person: link(memberRef(row.member_id) ?? contactRef(row.contact_id)),
    orgId: row.org_id,
    orgName: row.org_name,
    dealId: row.deal_id,
    dealTitle: row.deal_title,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

const keepFollowUps = (items: FollowUp[]) => [...items.filter((item) => !item.doneAt), ...items.filter((item) => item.doneAt).slice(0, 5)]

interface IntroRow {
  id: number
  member_id: number | null
  lead_id: number | null
  contact_id: number
  reason: string
  status: IntroStatus
  outcome: string
  made_by: string
  created_at: string
  updated_at: string
}

const INTRO_SELECT = 'SELECT id, member_id, lead_id, contact_id, reason, status, outcome, made_by, created_at, updated_at FROM intros'

function toIntro(row: IntroRow, link: ReturnType<typeof linker>): Intro | null {
  const student = link(memberRef(row.member_id) ?? contactRef(row.lead_id))
  const contact = link(contactRef(row.contact_id))
  if (!student || !contact) return null
  return {
    id: row.id,
    student,
    contact,
    reason: row.reason,
    status: row.status,
    outcome: row.outcome,
    madeBy: row.made_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface DealRow {
  id: number
  org_id: number
  org_name: string
  contact_id: number | null
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
  next_id: number | null
  next_title: string | null
  next_due: string | null
  created_at: string
  updated_at: string
}

// The deal's earliest open follow-up rides along as three columns.
const DEAL_SELECT = `SELECT d.id, d.org_id, o.name AS org_name, d.contact_id, d.type, d.title, d.ask, d.amount_cents, d.stage,
  d.passed_at, d.event_id, e.title AS event_title, d.notes, d.owner_email, d.created_at, d.updated_at,
  n.id AS next_id, n.title AS next_title, n.due_on AS next_due
  FROM deals d JOIN orgs o ON o.id = d.org_id LEFT JOIN events e ON e.id = d.event_id
  LEFT JOIN follow_ups n ON n.id = (SELECT f.id FROM follow_ups f WHERE f.deal_id = d.id AND f.done_at IS NULL ORDER BY f.due_on, f.id LIMIT 1)`

function toDeal(row: DealRow, link: ReturnType<typeof linker>): Deal {
  return {
    id: row.id,
    orgId: row.org_id,
    orgName: row.org_name,
    contact: link(contactRef(row.contact_id)),
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
    nextFollowUp: row.next_id !== null ? { id: row.next_id, title: row.next_title ?? '', dueOn: row.next_due ?? '' } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const dealDetail = (deal: { type: DealType; stage: DealStage; passed_at: string | null; ask: string }) =>
  [DEAL_TYPE_LABELS[deal.type], deal.passed_at ? 'Passed' : DEAL_STAGE_LABELS[deal.stage], deal.ask].filter(Boolean).join(' · ')

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// ---------------------------------------------------------------- one person

/** A person's page: everything we hold on them, from every table, newest first. */
export async function loadPersonDetail(db: D1Database, ref: PersonRef, index?: PeopleIndex): Promise<PersonDetail> {
  const people = index ?? (await loadPeople(db))
  // A contact who is really a member opens as the member.
  const memberId = ref.type === 'member' ? ref.id : people.fold.get(ref.id)
  const member = memberId !== undefined ? people.members.get(memberId) : undefined
  const self = member ?? (ref.type === 'contact' ? people.contacts.get(ref.id) : undefined)
  if (!self) throw new ApiError(404, ref.type === 'member' ? 'No such member.' : 'No such person.')
  const key = member ? personKey({ type: 'member', id: member.id }) : personKey(ref)
  const summary = people.summaries.find((entry) => entry.key === key)
  if (!summary) throw new ApiError(404, 'No such person.')

  const contactIds = member
    ? [...people.fold].filter(([, folded]) => folded === member.id).map(([contactId]) => contactId)
    : [ref.id]
  const ids = inList(contactIds)
  const email = self.email
  const mid = member?.id ?? null
  const link = linker(people)

  const results = await db.batch([
    db
      .prepare(
        `SELECT r.id, r.event_id, r.created_at, e.title, e.date FROM rsvps r JOIN events e ON e.id = r.event_id WHERE r.email = ?`,
      )
      .bind(email),
    db.prepare('SELECT id, target, spend, amount, status, created_at FROM fund_interest WHERE email = ?').bind(email),
    db.prepare('SELECT id, role_title, status, created_at FROM role_applications WHERE email = ?').bind(email),
    db.prepare('SELECT id, role, note, created_at FROM board_interest WHERE email = ?').bind(email),
    db
      .prepare(
        `SELECT id, request, subject, status, owner_email, sent_at, created_at FROM asks
         WHERE contact_id IN ${ids} OR lower(to_email) = lower(?)`,
      )
      .bind(...contactIds, email),
    db
      .prepare(
        `SELECT t.id, t.subject, t.status, t.last_message_at, (SELECT COUNT(*) FROM mail_messages m WHERE m.thread_id = t.id) AS count
         FROM mail_threads t
         WHERE t.ask_id IS NULL AND (t.contact_id IN ${ids}
           OR t.id IN (SELECT thread_id FROM mail_messages WHERE from_email = ? OR to_addrs LIKE ?))`,
      )
      .bind(...contactIds, email, `%${email.replace(/[%_]/g, '')}%`),
    db
      .prepare(
        `SELECT i.id, i.kind, i.happened_on, i.summary, i.deal_id, i.created_by, o.name AS org_name, d.title AS deal_title
         FROM interactions i LEFT JOIN orgs o ON o.id = i.org_id LEFT JOIN deals d ON d.id = i.deal_id
         WHERE i.member_id = ? OR i.contact_id IN ${ids}`,
      )
      .bind(mid, ...contactIds),
    db
      .prepare(`${INTRO_SELECT} WHERE member_id = ? OR lead_id IN ${ids} OR contact_id IN ${ids} ORDER BY created_at DESC`)
      .bind(mid, ...contactIds, ...contactIds),
    db
      .prepare(
        `SELECT g.id, g.event_id, g.role, g.status, g.created_at, e.title, e.date FROM event_guests g JOIN events e ON e.id = g.event_id
         WHERE g.contact_id IN ${ids}`,
      )
      .bind(...contactIds),
    db
      .prepare('SELECT id, title, type, stage, passed_at, ask, owner_email, created_at FROM deals WHERE contact_id IN ' + ids)
      .bind(...contactIds),
    db.prepare(`${FOLLOW_UP_SELECT} WHERE f.member_id = ? OR f.contact_id IN ${ids} ${FOLLOW_UP_ORDER}`).bind(mid, ...contactIds),
  ])
  const [rsvps, fund, applications, board, asks, threads, interactions, intros, guests, deals, followUps] = results.map(
    (result) => result.results as unknown[],
  )

  const timeline: TimelineItem[] = []
  if (member) {
    timeline.push({
      kind: 'joined',
      label: 'Joined',
      title: 'Signed up on proto.boston',
      detail: [member.year, member.track].filter(Boolean).join(' · '),
      at: member.created_at,
      href: null,
      by: null,
    })
    // Someone we knew before they signed up (a scouted lead, say) keeps that start.
    for (const contactId of contactIds) {
      const contact = people.contacts.get(contactId)
      if (!contact) continue
      timeline.push({
        kind: 'joined',
        label: 'Added',
        title: `Added as ${contact.kind === 'alum' ? 'an alum' : `a ${contact.kind}`}`,
        detail: clip(contact.notes),
        at: contact.created_at,
        href: null,
        by: contact.created_by,
      })
    }
  } else {
    const contact = self as ContactRow
    timeline.push({ kind: 'joined', label: 'Added', title: 'Added to People', detail: '', at: contact.created_at, href: null, by: contact.created_by })
  }
  for (const row of rsvps as { id: number; event_id: number; created_at: string; title: string; date: string }[]) {
    timeline.push({ kind: 'rsvp', label: 'Event', title: `RSVP · ${row.title}`, detail: '', at: row.created_at, href: `/admin/events/${row.event_id}`, by: null })
  }
  for (const row of fund as { id: number; target: string; spend: string; amount: string; status: string; created_at: string }[]) {
    timeline.push({
      kind: 'fund',
      label: 'Fund',
      title: `Fund request · ${row.amount}`,
      detail: [row.target, capitalize(row.status)].filter(Boolean).join(' · '),
      at: row.created_at,
      href: '/admin/fund',
      by: null,
    })
  }
  for (const row of applications as { id: number; role_title: string; status: string; created_at: string }[]) {
    timeline.push({
      kind: 'application',
      label: 'Applied',
      title: `Applied for ${row.role_title}`,
      detail: capitalize(row.status),
      at: row.created_at,
      href: '/admin/roles/applications',
      by: null,
    })
  }
  for (const row of board as { id: number; role: string; note: string; created_at: string }[]) {
    timeline.push({
      kind: 'board_interest',
      label: 'Board',
      title: `Interested in ${row.role}`,
      detail: clip(row.note),
      at: row.created_at,
      href: '/admin/board/interest',
      by: null,
    })
  }
  for (const row of asks as { id: number; request: string; subject: string; status: string; owner_email: string; sent_at: string | null; created_at: string }[]) {
    timeline.push({
      kind: 'ask',
      label: 'Ask',
      title: row.subject || clip(row.request),
      detail: row.subject ? clip(row.request, 140) : '',
      at: row.sent_at ?? row.created_at,
      href: `/admin/email/asks/${row.id}`,
      by: row.owner_email,
    })
  }
  for (const row of threads as { id: number; subject: string; status: string; last_message_at: string; count: number }[]) {
    timeline.push({
      kind: 'email',
      label: 'Email',
      title: row.subject || '(no subject)',
      detail: row.count === 1 ? '1 email' : `${row.count} emails`,
      at: row.last_message_at,
      href: `/admin/email/inbox/${row.id}`,
      by: null,
    })
  }
  for (const row of interactions as { id: number; kind: InteractionKind; happened_on: string; summary: string; deal_id: number | null; created_by: string; org_name: string | null; deal_title: string | null }[]) {
    const label = INTERACTION_KIND_LABELS[row.kind]
    const { title, rest } = splitSummary(row.summary)
    timeline.push({
      kind: 'interaction',
      label,
      title: title || label,
      // What it was about, when it was about an org or a deal, after what was said.
      detail: [rest, row.deal_title ?? row.org_name].filter(Boolean).join(' · '),
      at: row.happened_on,
      href: row.deal_id ? `/admin/pipeline/${row.deal_id}` : null,
      by: row.created_by,
    })
  }
  const introItems = (intros as IntroRow[]).map((row) => toIntro(row, link)).filter((intro): intro is Intro => Boolean(intro))
  for (const intro of introItems) {
    const isStudent = intro.student.key === key
    const other = isStudent ? intro.contact : intro.student
    timeline.push({
      kind: 'intro',
      label: 'Intro',
      title: isStudent
        ? `Introduced to ${other.name}${other.orgName ? `, ${other.orgName}` : ''}`
        : `Introduced ${other.name}`,
      detail: [INTRO_STATUS_LABELS[intro.status], intro.outcome || intro.reason].filter(Boolean).join(' · '),
      at: intro.createdAt,
      href: '/admin/activity/intros',
      by: intro.madeBy,
    })
  }
  for (const row of guests as { id: number; event_id: number; role: GuestRole; status: GuestStatus; created_at: string; title: string; date: string }[]) {
    timeline.push({
      kind: 'guest',
      label: 'Event',
      title: `${capitalize(row.role)} · ${row.title}`,
      detail: capitalize(row.status),
      // When the event is, since that's when they're part of it.
      at: row.date,
      href: `/admin/events/${row.event_id}`,
      by: null,
    })
  }
  for (const row of deals as { id: number; title: string; type: DealType; stage: DealStage; passed_at: string | null; ask: string; owner_email: string | null; created_at: string }[]) {
    timeline.push({ kind: 'deal', label: 'Deal', title: row.title, detail: dealDetail(row), at: row.created_at, href: `/admin/pipeline/${row.id}`, by: row.owner_email })
  }

  const contact = member ? undefined : (self as ContactRow)
  const folded = member ? contactIds.map((id) => people.contacts.get(id)).find((row) => row?.link) : undefined
  return {
    ...summary,
    notes: self.notes,
    link: contact?.link ?? folded?.link ?? '',
    unsubscribed: member ? member.unsubscribed === 1 : null,
    timeline: newestFirst(timeline),
    followUps: keepFollowUps((followUps as FollowUpRow[]).map((row) => toFollowUp(row, link))),
    intros: introItems,
  }
}

// ---------------------------------------------------------------- orgs

interface OrgRow {
  id: number
  name: string
  kind: OrgKind
  website: string
  focus: string
  notes: string
  owner_email: string | null
  wall: Wall
  wall_order: number
  logo: string | null
  contact_count: number
  open_deal_count: number
  created_at: string
  updated_at: string
}

export const ORG_SELECT = `SELECT o.id, o.name, o.kind, o.website, o.focus, o.notes, o.owner_email, o.wall, o.wall_order, o.logo,
  o.created_at, o.updated_at,
  (SELECT COUNT(*) FROM contacts c WHERE c.org_id = o.id) AS contact_count,
  (SELECT COUNT(*) FROM deals d WHERE d.org_id = o.id AND d.passed_at IS NULL AND d.stage != 'delivered') AS open_deal_count
  FROM orgs o`

// The newest thing per org: interactions with it or its people, its deals moving, asks, email and intros to its people.
const ORG_TOUCHES = [
  "SELECT org_id AS ref, kind AS label, MAX(happened_on) AS at FROM interactions WHERE org_id IS NOT NULL GROUP BY org_id",
  "SELECT c.org_id AS ref, i.kind AS label, MAX(i.happened_on) AS at FROM interactions i JOIN contacts c ON c.id = i.contact_id WHERE c.org_id IS NOT NULL GROUP BY c.org_id",
  "SELECT org_id AS ref, 'deal' AS label, MAX(updated_at) AS at FROM deals GROUP BY org_id",
  "SELECT c.org_id AS ref, 'ask' AS label, MAX(COALESCE(a.sent_at, a.created_at)) AS at FROM asks a JOIN contacts c ON c.id = a.contact_id WHERE c.org_id IS NOT NULL GROUP BY c.org_id",
  "SELECT c.org_id AS ref, 'email' AS label, MAX(t.last_message_at) AS at FROM mail_threads t JOIN contacts c ON c.id = t.contact_id WHERE c.org_id IS NOT NULL GROUP BY c.org_id",
  "SELECT c.org_id AS ref, 'intro' AS label, MAX(i.created_at) AS at FROM intros i JOIN contacts c ON c.id = i.contact_id WHERE c.org_id IS NOT NULL GROUP BY c.org_id",
]

function toOrg(row: OrgRow, touches: Touch[]): Org {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    website: row.website,
    focus: row.focus,
    notes: row.notes,
    ownerEmail: row.owner_email,
    wall: row.wall,
    wallOrder: row.wall_order,
    logo: row.logo,
    contactCount: row.contact_count,
    openDealCount: row.open_deal_count,
    lastTouch: latestTouch([...touches, { label: 'Added', at: row.created_at }]),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function orgTouches(db: D1Database): Promise<Map<number, Touch[]>> {
  const results = await db.batch<TouchRow>(ORG_TOUCHES.map((sql) => db.prepare(sql)))
  const touches = new Map<number, Touch[]>()
  for (const row of results.flatMap((result) => result.results)) {
    if (row.ref === null || !row.at) continue
    const id = Number(row.ref)
    touches.set(id, [...(touches.get(id) ?? []), { label: touchLabel(row.label), at: row.at }])
  }
  return touches
}

export async function loadOrgs(db: D1Database, filter: { kind?: OrgKind; q?: string }): Promise<Org[]> {
  const where: string[] = []
  const values: string[] = []
  if (filter.kind) {
    where.push('o.kind = ?')
    values.push(filter.kind)
  }
  if (filter.q) {
    const pattern = `%${filter.q.replace(/[\\%_]/g, '\\$&')}%`
    where.push("(o.name LIKE ? ESCAPE '\\' OR o.website LIKE ? ESCAPE '\\' OR o.focus LIKE ? ESCAPE '\\')")
    values.push(pattern, pattern, pattern)
  }
  const [rows, touches] = await Promise.all([
    db
      .prepare(`${ORG_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.name COLLATE NOCASE`)
      .bind(...values)
      .all<OrgRow>(),
    orgTouches(db),
  ])
  return rows.results.map((row) => toOrg(row, touches.get(row.id) ?? []))
}

export async function loadOrgDetail(db: D1Database, id: number): Promise<OrgDetail> {
  const row = await db.prepare(`${ORG_SELECT} WHERE o.id = ?`).bind(id).first<OrgRow>()
  if (!row) throw new ApiError(404, 'No such org.')
  const [people, touches] = await Promise.all([loadPeople(db), orgTouches(db)])
  const link = linker(people)
  const contactIds = [...people.contacts.values()].filter((contact) => contact.org_id === id).map((contact) => contact.id)
  const ids = inList(contactIds)

  const results = await db.batch([
    db.prepare(`${DEAL_SELECT} WHERE d.org_id = ? ORDER BY d.passed_at IS NOT NULL, d.created_at DESC`).bind(id),
    db
      .prepare(
        `SELECT i.id, i.kind, i.happened_on, i.summary, i.member_id, i.contact_id, i.deal_id, i.created_by, d.title AS deal_title
         FROM interactions i LEFT JOIN deals d ON d.id = i.deal_id WHERE i.org_id = ? OR i.contact_id IN ${ids}`,
      )
      .bind(id, ...contactIds),
    db.prepare(`${INTRO_SELECT} WHERE contact_id IN ${ids} ORDER BY created_at DESC`).bind(...contactIds),
    db
      .prepare(
        `SELECT g.event_id, g.role, g.status, g.contact_id, e.title, e.date FROM event_guests g JOIN events e ON e.id = g.event_id
         WHERE g.contact_id IN ${ids} ORDER BY e.date DESC`,
      )
      .bind(...contactIds),
    db
      .prepare(
        `SELECT id, contact_id, to_name, request, subject, owner_email, sent_at, created_at FROM asks WHERE contact_id IN ${ids}`,
      )
      .bind(...contactIds),
    db
      .prepare(
        `SELECT t.id, t.subject, t.contact_id, t.last_message_at FROM mail_threads t WHERE t.ask_id IS NULL AND t.contact_id IN ${ids}`,
      )
      .bind(...contactIds),
    db
      .prepare(
        `${FOLLOW_UP_SELECT} WHERE f.org_id = ? OR f.contact_id IN ${ids} OR f.deal_id IN (SELECT id FROM deals WHERE org_id = ?) ${FOLLOW_UP_ORDER}`,
      )
      .bind(id, ...contactIds, id),
  ])
  const [dealRows, interactionRows, introRows, guestRows, askRows, threadRows, followUpRows] = results.map(
    (result) => result.results as unknown[],
  )
  const nameOf = (contactId: number | null) => (contactId === null ? '' : (link(contactRef(contactId))?.name ?? ''))

  const deals = (dealRows as DealRow[]).map((deal) => toDeal(deal, link))
  const intros = (introRows as IntroRow[]).map((intro) => toIntro(intro, link)).filter((intro): intro is Intro => Boolean(intro))

  const timeline: TimelineItem[] = [
    { kind: 'joined', label: 'Added', title: 'Added to Orgs', detail: ORG_KIND_LABELS[row.kind], at: row.created_at, href: null, by: null },
  ]
  for (const item of interactionRows as { id: number; kind: InteractionKind; happened_on: string; summary: string; member_id: number | null; contact_id: number | null; deal_id: number | null; created_by: string; deal_title: string | null }[]) {
    const label = INTERACTION_KIND_LABELS[item.kind]
    const who = link(memberRef(item.member_id) ?? contactRef(item.contact_id))?.name
    timeline.push({
      kind: 'interaction',
      label,
      title: [who ?? label, item.deal_title].filter(Boolean).join(' · '),
      detail: item.summary,
      at: item.happened_on,
      href: item.deal_id ? `/admin/pipeline/${item.deal_id}` : null,
      by: item.created_by,
    })
  }
  for (const deal of dealRows as DealRow[]) {
    timeline.push({ kind: 'deal', label: 'Deal', title: deal.title, detail: dealDetail(deal), at: deal.created_at, href: `/admin/pipeline/${deal.id}`, by: deal.owner_email })
  }
  for (const intro of intros) {
    timeline.push({
      kind: 'intro',
      label: 'Intro',
      title: `${intro.student.name} to ${intro.contact.name}`,
      detail: [INTRO_STATUS_LABELS[intro.status], intro.outcome || intro.reason].filter(Boolean).join(' · '),
      at: intro.createdAt,
      href: '/admin/activity/intros',
      by: intro.madeBy,
    })
  }
  const events: OrgDetail['events'] = []
  for (const guest of guestRows as { event_id: number; role: GuestRole; status: GuestStatus; contact_id: number; title: string; date: string }[]) {
    const personName = nameOf(guest.contact_id)
    events.push({ eventId: guest.event_id, title: guest.title, date: guest.date, role: guest.role, personName })
    timeline.push({
      kind: 'guest',
      label: 'Event',
      title: `${capitalize(guest.role)} · ${guest.title}`,
      detail: [personName, capitalize(guest.status)].filter(Boolean).join(' · '),
      at: guest.date,
      href: `/admin/events/${guest.event_id}`,
      by: null,
    })
  }
  for (const ask of askRows as { id: number; contact_id: number; to_name: string; request: string; subject: string; owner_email: string; sent_at: string | null; created_at: string }[]) {
    timeline.push({
      kind: 'ask',
      label: 'Ask',
      title: ask.subject || clip(ask.request),
      detail: `To ${nameOf(ask.contact_id) || ask.to_name}`,
      at: ask.sent_at ?? ask.created_at,
      href: `/admin/email/asks/${ask.id}`,
      by: ask.owner_email,
    })
  }
  for (const thread of threadRows as { id: number; subject: string; contact_id: number; last_message_at: string }[]) {
    timeline.push({
      kind: 'email',
      label: 'Email',
      title: thread.subject || '(no subject)',
      detail: nameOf(thread.contact_id),
      at: thread.last_message_at,
      href: `/admin/email/inbox/${thread.id}`,
      by: null,
    })
  }

  return {
    ...toOrg(row, touches.get(id) ?? []),
    contacts: people.summaries.filter((person) => person.orgId === id),
    deals,
    timeline: newestFirst(timeline),
    followUps: keepFollowUps((followUpRows as FollowUpRow[]).map((item) => toFollowUp(item, link))),
    intros,
    events,
  }
}
