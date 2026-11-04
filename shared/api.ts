// The contract between the site (src/), the portal (src/admin/) and the Worker (worker/).
// Every request and response body the API speaks is typed here; input bodies also have a zod
// schema the Worker validates with. Keep this file free of DOM and Workers APIs: both sides
// import it.
//
// Conventions
// - JSON everywhere, camelCase keys. Content dates are ISO days (yyyy-mm-dd); timestamps are
//   ISO-8601 UTC strings as SQLite writes them ("2026-11-03 21:14:05").
// - Errors are { error: string, issues?: Record<field, message> } with a 4xx/5xx status.
// - Lists come back as { items: T[] }, single records as { item: T }.

import { z } from 'zod'

// ---- Content the portal edits ---------------------------------------------------------------

export const CONTENT_RESOURCES = ['events', 'hackathons', 'wins', 'board'] as const
export type ContentResource = (typeof CONTENT_RESOURCES)[number]

export const EVENT_KINDS = ['Hack night', 'Why hackathons', 'Prep night', 'Panel', 'Workshop', 'Demo night'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use yyyy-mm-dd')
const text = (max: number) => z.string().trim().min(1, 'Required').max(max)
const optionalText = (max: number) => z.string().trim().max(max)
const optionalUrl = z.union([z.literal(''), z.url('Must be a full URL')]).transform((value) => value || null)
/** A link or a path under public/ (e.g. /photos/win.jpg), or empty for none. */
const optionalImage = z
  .union([z.literal(''), z.url(), z.string().regex(/^\/[^\s]*$/, 'A full URL or a /path')])
  .transform((value) => value || null)

/** Flags every content row has. `placeholder` renders the "sample" tag; unpublished rows stay out of the site. */
const flags = { placeholder: z.boolean(), published: z.boolean() }

export const eventInput = z.object({
  kind: z.enum(EVENT_KINDS),
  title: text(120),
  date: isoDay,
  time: text(40),
  place: text(120),
  text: optionalText(600),
  ...flags,
})

export const hackathonInput = z.object({
  name: text(80),
  starts: isoDay,
  ends: isoDay,
  location: text(80),
  applyBy: isoDay,
  travelCovered: z.boolean(),
  buGoing: z.number().int().min(0).max(999),
  href: z.union([z.literal(''), z.url('Must be a full URL')]),
  ...flags,
})

export const winInput = z.object({
  project: text(80),
  blurb: optionalText(300),
  event: text(80),
  placement: text(60),
  team: z.array(text(80)).max(12),
  photo: optionalImage,
  devpost: optionalUrl,
  position: z.number().int(),
  ...flags,
})

export const linkInput = z.object({ label: text(40), href: z.url('Must be a full URL') })

export const boardMemberInput = z.object({
  name: text(80),
  role: text(80),
  photo: optionalImage,
  links: z.array(linkInput).max(6),
  position: z.number().int(),
  ...flags,
})

export type EventInput = z.input<typeof eventInput>
export type HackathonInput = z.input<typeof hackathonInput>
export type WinInput = z.input<typeof winInput>
export type BoardMemberInput = z.input<typeof boardMemberInput>

interface Row {
  id: number
  createdAt: string
  updatedAt: string
}

export type ProtoEvent = z.output<typeof eventInput> & Row
export type Hackathon = z.output<typeof hackathonInput> & Row
export type Win = z.output<typeof winInput> & Row
export type BoardMember = z.output<typeof boardMemberInput> & Row

export interface ContentTypes {
  events: ProtoEvent
  hackathons: Hackathon
  wins: Win
  board: BoardMember
}

export const CONTENT_INPUTS = {
  events: eventInput,
  hackathons: hackathonInput,
  wins: winInput,
  board: boardMemberInput,
} as const

// ---- How each content resource maps to D1 and to the portal's editor ------------------------

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'number'
  | 'boolean'
  | 'select'
  | 'url'
  | 'image'
  /** string[], stored as JSON */
  | 'list'
  /** { label, href }[], stored as JSON */
  | 'links'

export interface FieldSpec {
  /** Key in the API object. */
  key: string
  /** Column in D1. */
  column: string
  label: string
  type: FieldType
  options?: readonly string[]
  hint?: string
}

export interface ResourceSpec {
  resource: ContentResource
  table: string
  /** Plural and singular names for the portal. */
  label: string
  singular: string
  /** Key shown as each row's title in the portal list. */
  titleKey: string
  /** Keys shown under the title in the portal list. */
  summaryKeys: readonly string[]
  /** ORDER BY clause for every list (public and admin). */
  orderBy: string
  /** Everything editable, in editor order. `placeholder` and `published` are always last. */
  fields: readonly FieldSpec[]
}

const FLAG_FIELDS: readonly FieldSpec[] = [
  { key: 'placeholder', column: 'placeholder', label: 'Sample content', type: 'boolean', hint: 'Shows the "sample" tag on the site. Untick once it’s real and checked.' },
  { key: 'published', column: 'published', label: 'Published', type: 'boolean', hint: 'Unpublished rows only show here.' },
]

export const RESOURCE_SPECS: Record<ContentResource, ResourceSpec> = {
  events: {
    resource: 'events',
    table: 'events',
    label: 'Events',
    singular: 'Event',
    titleKey: 'title',
    summaryKeys: ['date', 'kind'],
    orderBy: 'date ASC, id ASC',
    fields: [
      { key: 'title', column: 'title', label: 'Title', type: 'text' },
      { key: 'kind', column: 'kind', label: 'Kind', type: 'select', options: EVENT_KINDS },
      { key: 'date', column: 'date', label: 'Date', type: 'date' },
      { key: 'time', column: 'time', label: 'Time', type: 'text', hint: 'e.g. 7:00–10:00 PM' },
      { key: 'place', column: 'place', label: 'Place', type: 'text' },
      { key: 'text', column: 'text', label: 'Description', type: 'textarea' },
      ...FLAG_FIELDS,
    ],
  },
  hackathons: {
    resource: 'hackathons',
    table: 'hackathons',
    label: 'Hackathons',
    singular: 'Hackathon',
    titleKey: 'name',
    summaryKeys: ['starts', 'location'],
    orderBy: 'starts ASC, id ASC',
    fields: [
      { key: 'name', column: 'name', label: 'Name', type: 'text' },
      { key: 'starts', column: 'starts', label: 'Starts', type: 'date' },
      { key: 'ends', column: 'ends', label: 'Ends', type: 'date' },
      { key: 'location', column: 'location', label: 'Location', type: 'text' },
      { key: 'applyBy', column: 'apply_by', label: 'Apply by', type: 'date' },
      { key: 'travelCovered', column: 'travel_covered', label: 'Travel covered', type: 'boolean', hint: 'The hackathon pays for or reimburses travel.' },
      { key: 'buGoing', column: 'bu_going', label: 'BU people going', type: 'number' },
      { key: 'href', column: 'href', label: 'Website', type: 'url' },
      ...FLAG_FIELDS,
    ],
  },
  wins: {
    resource: 'wins',
    table: 'wins',
    label: 'Wins',
    singular: 'Win',
    titleKey: 'project',
    summaryKeys: ['placement', 'event'],
    orderBy: 'position ASC, id DESC',
    fields: [
      { key: 'project', column: 'project', label: 'Project', type: 'text' },
      { key: 'blurb', column: 'blurb', label: 'One line', type: 'textarea' },
      { key: 'event', column: 'event', label: 'Hackathon', type: 'text' },
      { key: 'placement', column: 'placement', label: 'Placement', type: 'text', hint: 'e.g. 1st overall, Best hardware hack' },
      { key: 'team', column: 'team', label: 'Team', type: 'list', hint: 'One name per line.' },
      { key: 'photo', column: 'photo', label: 'Photo', type: 'image', hint: 'A full URL or a path under public/, e.g. /photos/pantry-pal.jpg' },
      { key: 'devpost', column: 'devpost', label: 'Devpost link', type: 'url' },
      { key: 'position', column: 'position', label: 'Order', type: 'number', hint: 'Lower shows first.' },
      ...FLAG_FIELDS,
    ],
  },
  board: {
    resource: 'board',
    table: 'board_members',
    label: 'Board',
    singular: 'Board member',
    titleKey: 'name',
    summaryKeys: ['role'],
    orderBy: 'position ASC, id ASC',
    fields: [
      { key: 'name', column: 'name', label: 'Name', type: 'text' },
      { key: 'role', column: 'role', label: 'Role', type: 'text' },
      { key: 'photo', column: 'photo', label: 'Photo', type: 'image', hint: 'A full URL or a path under public/.' },
      { key: 'links', column: 'links', label: 'Links', type: 'links', hint: 'GitHub, LinkedIn, a personal site…' },
      { key: 'position', column: 'position', label: 'Order', type: 'number', hint: 'Lower shows first.' },
      ...FLAG_FIELDS,
    ],
  },
}

// ---- Public forms -----------------------------------------------------------------------------

export const YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Grad student', 'Other'] as const
export const TRACKS = ['Start', 'Build', 'Launch', 'Not sure yet'] as const
export const FUND_AMOUNTS = ['$50–$100', '$100–$250', '$250–$500', 'Not sure yet'] as const
export type Track = (typeof TRACKS)[number]

const buEmail = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^@\s]+@bu\.edu$/, 'Use your @bu.edu address')

/** Bots fill every field; people never see this one. Must be empty. */
const honeypot = { website: z.literal('').optional() }

/** POST /api/join → 201 { ok: true }. Joining again with the same email updates the row (200). */
export const joinInput = z.object({
  name: text(80),
  email: buEmail,
  year: z.enum(YEARS),
  track: z.enum(TRACKS),
  ...honeypot,
})

/** POST /api/fund-interest → 201 { ok: true } */
export const fundInterestInput = z.object({
  name: text(80),
  email: buEmail,
  year: z.enum(YEARS),
  target: text(200),
  spend: text(1000),
  amount: z.enum(FUND_AMOUNTS),
  ...honeypot,
})

/** POST /api/events/:id/rsvp → 201 { ok: true, count } (200 if already RSVP'd). Any email, not just BU. */
export const rsvpInput = z.object({
  name: text(80),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter an email')),
  ...honeypot,
})

export type JoinInput = z.input<typeof joinInput>
export type FundInterestInput = z.input<typeof fundInterestInput>
export type RsvpInput = z.input<typeof rsvpInput>

export interface RsvpResult {
  ok: true
  count: number
}

// ---- Portal: admins and sessions ------------------------------------------------------------

/** GET /api/admin/me → 200 Me, or 401 when not signed in. */
export interface Me {
  login: string
  name: string | null
  avatarUrl: string | null
  /** Listed in ADMIN_GITHUB_LOGINS: can't be removed in the portal. */
  isOwner: boolean
}

/** GET /api/admin/admins → { items: Admin[] }  (owners first, then added admins) */
export interface Admin {
  login: string
  isOwner: boolean
  /** null for owners. */
  addedBy: string | null
  createdAt: string | null
  lastSeenAt: string | null
}

/** POST /api/admin/admins { login } → 201 { item: Admin }. DELETE /api/admin/admins/:login → 204. */
export const addAdminInput = z.object({
  login: z
    .string()
    .trim()
    .regex(/^[a-z\d](?:[a-z\d-]{0,38})$/i, 'Not a GitHub username'),
})

// ---- Portal: members, RSVPs, fund interest --------------------------------------------------

/** GET /api/admin/members?q=&track= → { items: Member[] } (newest first) */
export interface Member {
  id: number
  name: string
  email: string
  year: string
  track: string
  notes: string
  unsubscribed: boolean
  createdAt: string
  updatedAt: string
}

export interface Rsvp {
  id: number
  eventId: number
  name: string
  email: string
  createdAt: string
}

/** GET /api/admin/members/:id → MemberDetail. Matches RSVPs and fund interest by email. */
export interface MemberDetail {
  member: Member
  rsvps: (Rsvp & { eventTitle: string; eventDate: string })[]
  fundInterest: FundInterest[]
}

/** PATCH /api/admin/members/:id → { item: Member }. DELETE /api/admin/members/:id → 204. */
export const memberPatch = z
  .object({
    name: text(80),
    year: z.enum(YEARS),
    track: z.enum(TRACKS),
    notes: optionalText(2000),
    unsubscribed: z.boolean(),
  })
  .partial()

export const FUND_STATUSES = ['new', 'reviewing', 'approved', 'declined'] as const
export type FundStatus = (typeof FUND_STATUSES)[number]

/** GET /api/admin/fund?status= → { items: FundInterest[] } (newest first) */
export interface FundInterest {
  id: number
  name: string
  email: string
  year: string
  target: string
  spend: string
  amount: string
  status: FundStatus
  notes: string
  createdAt: string
  updatedAt: string
}

/** PATCH /api/admin/fund/:id → { item: FundInterest }. DELETE /api/admin/fund/:id → 204. */
export const fundPatch = z.object({ status: z.enum(FUND_STATUSES), notes: optionalText(2000) }).partial()

/**
 * GET /api/admin/events/:id/rsvps → { items: Rsvp[] }
 * DELETE /api/admin/rsvps/:id → 204
 * Admin content lists for events include `rsvpCount` on each item.
 */
export type AdminEvent = ProtoEvent & { rsvpCount: number }

/** GET /api/admin/stats */
export interface Stats {
  members: number
  membersThisWeek: number
  upcomingEvents: number
  upcomingRsvps: number
  fundNew: number
  fundTotal: number
  admins: number
}

// ---- Portal: email ----------------------------------------------------------------------------

export const emailAudience = z.discriminatedUnion('type', [
  /** Every member who hasn't unsubscribed. */
  z.object({ type: z.literal('members') }),
  /** Members on one track who haven't unsubscribed. */
  z.object({ type: z.literal('track'), track: z.enum(TRACKS) }),
  /** Everyone who RSVP'd to one event (member or not). */
  z.object({ type: z.literal('event'), eventId: z.number().int().positive() }),
  /** Everyone on the fund interest list with a given status (or all). */
  z.object({ type: z.literal('fund'), status: z.enum(FUND_STATUSES).optional() }),
])
export type EmailAudience = z.infer<typeof emailAudience>

/** GET /api/admin/email/audience?audience=<JSON EmailAudience> → { count } */
export interface AudienceCount {
  count: number
}

/**
 * POST /api/admin/email/send → 201 { item: EmailCampaign }
 * The body is plain text; blank lines become paragraphs. Member emails get an unsubscribe link.
 */
export const sendEmailInput = z.object({
  audience: emailAudience,
  subject: text(150),
  body: text(20000),
})

/** POST /api/admin/email/test { to, subject, body } → { ok: true, logged: boolean } sends one copy. */
export const testEmailInput = z.object({
  to: z.email('Enter an email'),
  subject: text(150),
  body: text(20000),
})

export type SendEmailInput = z.input<typeof sendEmailInput>
export type TestEmailInput = z.input<typeof testEmailInput>

/** GET /api/admin/email/campaigns → { items: EmailCampaign[] } (newest first) */
export interface EmailCampaign {
  id: number
  subject: string
  body: string
  audience: EmailAudience
  recipientCount: number
  sentCount: number
  failedCount: number
  /** 'logged' means RESEND_API_KEY isn't set, so nothing actually left (local dev). */
  status: 'sent' | 'partial' | 'failed' | 'logged'
  sentBy: string
  createdAt: string
}

// ---- Errors -----------------------------------------------------------------------------------

export interface ApiErrorBody {
  error: string
  /** Field → message, for validation failures (400). */
  issues?: Record<string, string>
}
