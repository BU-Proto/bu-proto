// The CRM's contract: People (members and contacts as one list), Orgs, Pipeline (deals),
// Activity (interactions, follow-ups, intros), event guests, Today and the Inbox's queue.
// Same conventions as ./api: camelCase JSON, ISO days (yyyy-mm-dd) for dates, SQLite timestamps
// ("2026-11-03 21:14:05") for moments, { items } for lists and { item } for one record.

import { z } from 'zod'

// ---------------------------------------------------------------- constants

export const ORG_KINDS = ['vc', 'company', 'campus', 'hackathon', 'other'] as const
export type OrgKind = (typeof ORG_KINDS)[number]
export const ORG_KIND_LABELS: Record<OrgKind, string> = { vc: 'VC', company: 'Company', campus: 'Campus', hackathon: 'Hackathon', other: 'Other' }

/** The logo walls on /track-record an org can show on. '' is none. */
export const WALLS = ['', 'sponsors', 'partners'] as const
export type Wall = (typeof WALLS)[number]

export const CONTACT_KINDS = ['contact', 'lead', 'alum'] as const
export type ContactKind = (typeof CONTACT_KINDS)[number]
/** A person's kind in People: members come from sign-ups, the rest are contacts. */
export type PersonKind = 'member' | ContactKind
export const PERSON_KIND_LABELS: Record<PersonKind, string> = { member: 'Member', lead: 'Lead', contact: 'Contact', alum: 'Alum' }

export const DEAL_TYPES = ['sponsor', 'partner', 'visit'] as const
export type DealType = (typeof DEAL_TYPES)[number]
export const DEAL_TYPE_LABELS: Record<DealType, string> = { sponsor: 'Sponsorship', partner: 'Partnership', visit: 'Speaker or visit' }

export const DEAL_STAGES = ['identified', 'reached_out', 'talking', 'committed', 'delivered'] as const
export type DealStage = (typeof DEAL_STAGES)[number]
export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  identified: 'Identified',
  reached_out: 'Reached out',
  talking: 'Talking',
  committed: 'Committed',
  delivered: 'Delivered',
}

export const INTERACTION_KINDS = ['call', 'meeting', 'coffee', 'email', 'visit', 'note'] as const
export type InteractionKind = (typeof INTERACTION_KINDS)[number]
export const INTERACTION_KIND_LABELS: Record<InteractionKind, string> = {
  call: 'Call',
  meeting: 'Meeting',
  coffee: 'Coffee',
  email: 'Email',
  visit: 'Campus visit',
  note: 'Note',
}

export const INTRO_STATUSES = ['drafting', 'sent', 'met', 'hired_or_funded', 'passed'] as const
export type IntroStatus = (typeof INTRO_STATUSES)[number]
export const INTRO_STATUS_LABELS: Record<IntroStatus, string> = {
  drafting: 'Drafting',
  sent: 'Sent',
  met: 'Met',
  hired_or_funded: 'Hired or funded',
  passed: 'Passed',
}

export const GUEST_ROLES = ['speaker', 'judge', 'sponsor', 'host', 'moderator', 'guest'] as const
export type GuestRole = (typeof GUEST_ROLES)[number]
export const GUEST_STATUSES = ['invited', 'confirmed', 'declined'] as const
export type GuestStatus = (typeof GUEST_STATUSES)[number]

// ---------------------------------------------------------------- people

/**
 * A person's key in URLs and requests: "m12" for member 12, "c4" for contact 4. Members and
 * contacts live in separate tables (see migrations/0019_crm.sql), so the key says which.
 */
export type PersonType = 'member' | 'contact'
export interface PersonRef {
  type: PersonType
  id: number
}
export const personKey = (ref: PersonRef) => `${ref.type === 'member' ? 'm' : 'c'}${ref.id}`
export function parsePersonKey(key: string): PersonRef | null {
  const match = /^([mc])([1-9]\d*)$/.exec(key)
  if (!match) return null
  return { type: match[1] === 'm' ? 'member' : 'contact', id: Number(match[2]) }
}
export const personKeySchema = z.string().regex(/^[mc][1-9]\d*$/, 'Pick a person.')

/** A person, as they're named next to something else (a follow-up's "with", an intro's two sides). */
export interface PersonLink {
  key: string
  name: string
  /** Their org's name, for contacts that have one. */
  orgName: string | null
}

/** GET /api/admin/people?kind=member|lead|contact|alum&q=&mine=1 → { items: PersonSummary[] } */
export interface PersonSummary {
  key: string
  type: PersonType
  id: number
  name: string
  email: string
  kind: PersonKind
  orgId: number | null
  orgName: string | null
  /** A contact's title at their org ("Partner"). */
  title: string
  /** Members only. */
  year: string | null
  track: string | null
  /** Members only: where they study (empty for none), their field, and what they're building. */
  school: string | null
  field: string | null
  building: string | null
  ownerEmail: string | null
  /** The latest thing that happened with them, from any source. */
  lastTouch: { label: string; at: string } | null
  /** Their earliest open follow-up. */
  nextFollowUp: { id: number; title: string; dueOn: string } | null
  createdAt: string
}

/** One line on a person's or org's timeline, newest first. `at` is a day or a timestamp. */
export interface TimelineItem {
  kind: 'interaction' | 'joined' | 'rsvp' | 'fund' | 'application' | 'board_interest' | 'ask' | 'email' | 'intro' | 'deal' | 'guest' | 'win'
  /** The short word in the timeline's first column ("Coffee", "Event", "Fund"). */
  label: string
  title: string
  detail: string
  at: string
  /** A portal path to open it, when it has a page. */
  href: string | null
  /** Who on the team did it, when someone did. */
  by: string | null
}

/** GET /api/admin/people/:key → { item: PersonDetail } */
export interface PersonDetail extends PersonSummary {
  notes: string
  link: string
  /** Members: subscribed to list email. */
  unsubscribed: boolean | null
  timeline: TimelineItem[]
  followUps: FollowUp[]
  intros: Intro[]
}

const text = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) => text(max).optional().default('')
const email = z.string().trim().toLowerCase().email('Enter an email address.').max(254)
// Someone on the team. Looser than `email`: local sign-in is you@localhost, which a strict email
// check refuses, and these only ever come from the portal's own pickers.
const teammate = z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+$/, 'Pick someone on the team.').max(254)
const ownerEmail = z.union([teammate, z.literal(''), z.null()]).optional().transform((value) => value || null)
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a day.')
const id = z.number().int().positive()

/** POST /api/admin/people → 201 { item: PersonDetail }. Adds a contact, lead or alum (members sign up on the site). */
export const personInput = z.object({
  name: text(120).min(1, 'Enter a name.'),
  email,
  kind: z.enum(CONTACT_KINDS).default('contact'),
  orgId: id.nullable().optional().default(null),
  title: optionalText(120),
  link: optionalText(300),
  notes: optionalText(4000),
  ownerEmail,
})
export type PersonInput = z.input<typeof personInput>

/** PATCH /api/admin/people/:key → { item: PersonDetail }. kind, orgId, title and link apply to contacts only. */
export const personPatch = z
  .object({
    name: text(120).min(1),
    notes: text(4000),
    ownerEmail,
    kind: z.enum(CONTACT_KINDS),
    orgId: id.nullable(),
    title: text(120),
    link: text(300),
  })
  .partial()
export type PersonPatch = z.input<typeof personPatch>

// ---------------------------------------------------------------- orgs

/** GET /api/admin/orgs?kind=&q= → { items: Org[] } */
export interface Org {
  id: number
  name: string
  kind: OrgKind
  website: string
  focus: string
  notes: string
  ownerEmail: string | null
  wall: Wall
  wallOrder: number
  /** An upload's name; its picture is at /api/uploads/:name. */
  logo: string | null
  contactCount: number
  openDealCount: number
  lastTouch: { label: string; at: string } | null
  createdAt: string
  updatedAt: string
}

/** GET /api/admin/orgs/:id → { item: OrgDetail } */
export interface OrgDetail extends Org {
  contacts: PersonSummary[]
  deals: Deal[]
  timeline: TimelineItem[]
  followUps: FollowUp[]
  intros: Intro[]
  /** Events their people came to as guests. */
  events: { eventId: number; title: string; date: string; role: GuestRole; personName: string }[]
}

/** POST /api/admin/orgs → 201 { item: OrgDetail }. wall, wallOrder and logo need Partnerships. */
export const orgInput = z.object({
  name: text(120).min(1, 'Enter a name.'),
  kind: z.enum(ORG_KINDS).default('company'),
  website: optionalText(300),
  focus: optionalText(160),
  notes: optionalText(4000),
  ownerEmail,
  wall: z.enum(WALLS).default(''),
  wallOrder: z.number().int().min(0).max(999).default(0),
  logo: z.string().max(120).nullable().optional().default(null),
})
export type OrgInput = z.input<typeof orgInput>
/** PATCH /api/admin/orgs/:id → { item: OrgDetail } */
export const orgPatch = orgInput.partial()
export type OrgPatch = z.input<typeof orgPatch>

// ---------------------------------------------------------------- pipeline

/** GET /api/admin/deals?type=&mine=1&passed=1 → { items: Deal[] } */
export interface Deal {
  id: number
  orgId: number
  orgName: string
  contact: PersonLink | null
  type: DealType
  title: string
  ask: string
  amountCents: number | null
  stage: DealStage
  passedAt: string | null
  eventId: number | null
  eventTitle: string | null
  notes: string
  ownerEmail: string | null
  nextFollowUp: { id: number; title: string; dueOn: string } | null
  createdAt: string
  updatedAt: string
}

/** GET /api/admin/deals/:id → { item: DealDetail } */
export interface DealDetail extends Deal {
  timeline: TimelineItem[]
  followUps: FollowUp[]
}

/** POST /api/admin/deals → 201 { item: DealDetail }. Needs Partnerships. */
export const dealInput = z.object({
  orgId: id,
  contactKey: personKeySchema.nullable().optional().default(null),
  type: z.enum(DEAL_TYPES),
  title: text(160).min(1, 'Say what the deal is.'),
  ask: optionalText(120),
  amountCents: z.number().int().min(0).max(100_000_000).nullable().optional().default(null),
  stage: z.enum(DEAL_STAGES).default('identified'),
  eventId: id.nullable().optional().default(null),
  notes: optionalText(4000),
  ownerEmail,
})
export type DealInput = z.input<typeof dealInput>
/** PATCH /api/admin/deals/:id → { item: DealDetail }. passed: true drops it, false brings it back. */
export const dealPatch = dealInput.omit({ orgId: true }).partial().extend({ passed: z.boolean().optional() })
export type DealPatch = z.input<typeof dealPatch>

// ---------------------------------------------------------------- activity

/** GET /api/admin/interactions?personKey=&orgId=&dealId= → { items: Interaction[] } */
export interface Interaction {
  id: number
  kind: InteractionKind
  happenedOn: string
  summary: string
  person: PersonLink | null
  orgId: number | null
  orgName: string | null
  dealId: number | null
  dealTitle: string | null
  createdBy: string
  createdAt: string
}

/** POST /api/admin/interactions → 201 { item: Interaction, followUp: FollowUp | null } */
export const interactionInput = z.object({
  kind: z.enum(INTERACTION_KINDS),
  happenedOn: isoDay,
  summary: optionalText(8000),
  personKey: personKeySchema.nullable().optional().default(null),
  orgId: id.nullable().optional().default(null),
  dealId: id.nullable().optional().default(null),
  /** The next step, made into a follow-up on the same person, org or deal. */
  followUp: z
    .object({ title: text(200).min(1, 'Say what the next step is.'), dueOn: isoDay, ownerEmail: teammate })
    .nullable()
    .optional()
    .default(null),
})
export type InteractionInput = z.input<typeof interactionInput>

/** GET /api/admin/follow-ups?open=1&mine=1&personKey=&orgId=&dealId= → { items: FollowUp[] } (open ones by due day) */
export interface FollowUp {
  id: number
  title: string
  dueOn: string
  ownerEmail: string
  doneAt: string | null
  person: PersonLink | null
  orgId: number | null
  orgName: string | null
  dealId: number | null
  dealTitle: string | null
  createdBy: string
  createdAt: string
}

/** POST /api/admin/follow-ups → 201 { item: FollowUp } */
export const followUpInput = z.object({
  title: text(200).min(1, 'Say what needs doing.'),
  dueOn: isoDay,
  ownerEmail: teammate,
  personKey: personKeySchema.nullable().optional().default(null),
  orgId: id.nullable().optional().default(null),
  dealId: id.nullable().optional().default(null),
})
export type FollowUpInput = z.input<typeof followUpInput>
/** PATCH /api/admin/follow-ups/:id → { item: FollowUp }. done: true ticks it off. */
export const followUpPatch = z
  .object({ title: text(200).min(1), dueOn: isoDay, ownerEmail: teammate, done: z.boolean() })
  .partial()
export type FollowUpPatch = z.input<typeof followUpPatch>

/** GET /api/admin/intros?personKey=&orgId= → { items: Intro[] } */
export interface Intro {
  id: number
  /** The member or lead being introduced. */
  student: PersonLink
  /** The contact they're introduced to. */
  contact: PersonLink
  reason: string
  status: IntroStatus
  outcome: string
  madeBy: string
  createdAt: string
  updatedAt: string
}

/** POST /api/admin/intros → 201 { item: Intro }. studentKey is a member or a lead; contactKey any contact. */
export const introInput = z.object({
  studentKey: personKeySchema,
  contactKey: personKeySchema,
  reason: optionalText(500),
  status: z.enum(INTRO_STATUSES).default('drafting'),
})
export type IntroInput = z.input<typeof introInput>
export const introPatch = z.object({ status: z.enum(INTRO_STATUSES), reason: text(500), outcome: text(2000) }).partial()
export type IntroPatch = z.input<typeof introPatch>

// ---------------------------------------------------------------- event guests

/** GET /api/admin/events/:id/guests → { items: EventGuest[] } */
export interface EventGuest {
  id: number
  eventId: number
  contact: PersonLink
  role: GuestRole
  status: GuestStatus
  ownerEmail: string | null
}
/** POST /api/admin/events/:id/guests → 201 { item: EventGuest }. Needs Community. */
export const eventGuestInput = z.object({
  contactKey: personKeySchema,
  role: z.enum(GUEST_ROLES).default('guest'),
  status: z.enum(GUEST_STATUSES).default('invited'),
  ownerEmail,
})
export type EventGuestInput = z.input<typeof eventGuestInput>
export const eventGuestPatch = eventGuestInput.omit({ contactKey: true }).partial()

// ---------------------------------------------------------------- today and the inbox

/** Where something waiting in the Inbox came from. */
export const QUEUE_SOURCES = ['email', 'signup', 'fund', 'application', 'founder', 'board'] as const
export type QueueSource = (typeof QUEUE_SOURCES)[number]
export const QUEUE_SOURCE_LABELS: Record<QueueSource, string> = {
  email: 'Email',
  signup: 'Sign-up',
  fund: 'Fund request',
  application: 'Application',
  founder: 'Founders Circle',
  board: 'Board interest',
}

/** GET /api/admin/queue?source=&waiting=1 → { items: QueueItem[], counts: Record<QueueSource, number> } */
export interface QueueItem {
  source: QueueSource
  /** The row's id in its own table (mail_threads, members, fund_interest, role_applications, founder_applications, board_interest). */
  id: number
  name: string
  email: string
  /** A subject, a role, an amount: what it's about, in a line. */
  title: string
  snippet: string
  at: string
  /** Still needs someone. */
  waiting: boolean
  /** Its own page in the portal. */
  href: string
  /** The person it's from, when they're in People. */
  personKey: string | null
}

/** POST /api/admin/queue/:source/:id/review → { ok: true }. Marks a sign-up or board interest as seen (the others have statuses of their own). */

/** GET /api/admin/today → Today */
export interface Today {
  /** Open follow-ups due within the next 7 days or overdue, everyone's, by due day. */
  followUps: FollowUp[]
  /** How many are waiting in each Inbox queue. */
  waiting: Record<QueueSource, number>
  /** Events and hackathon apply-by days from today on, soonest first. */
  upcoming: { kind: 'event' | 'hackathon'; id: number; title: string; date: string; detail: string; href: string }[]
  /** What's happened lately, across interactions, deals, sign-ups, wins and intros, newest first. */
  activity: TimelineItem[]
  /** Deals not passed or delivered. */
  openDeals: number
}
