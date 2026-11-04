// The contract between the site (src/), the portal (src/admin/) and the Worker (worker/).
// Every request and response body the API speaks is typed here (plain constants live in
// ./constants and are re-exported); input bodies also have a zod
// schema the Worker validates with. Keep this file free of DOM and Workers APIs: both sides
// import it.
//
// Conventions
// - JSON everywhere, camelCase keys. Content dates are ISO days (yyyy-mm-dd); timestamps are
//   ISO-8601 UTC strings as SQLite writes them ("2026-11-03 21:14:05").
// - Errors are { error: string, issues?: Record<field, message> } with a 4xx/5xx status.
// - Lists come back as { items: T[] }, single records as { item: T }.

import { z } from 'zod'
import {
  EVENT_KINDS,
  FUND_AMOUNTS,
  FUND_STATUSES,
  TRACKS,
  YEARS,
  type ContentResource,
  type FundStatus,
} from './constants'

export * from './constants'

// ---- Content the portal edits ---------------------------------------------------------------

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

/** One teammate: their name, and optionally where to find them (LinkedIn, a personal site, GitHub). */
export const personInput = z.object({ name: text(80), href: optionalUrl })

/** A gallery photo: a full URL or a path under public/. */
const galleryImage = z.union([z.url(), z.string().regex(/^\/[^\s]*$/)], {
  error: 'Use a full URL (https://…) or a /path under public/.',
})

export const eventInput = z.object({
  kind: z.enum(EVENT_KINDS),
  title: text(120),
  date: isoDay,
  time: text(40),
  place: text(120),
  /** One or two lines for lists and cards. */
  text: optionalText(600),
  photo: optionalImage,
  /** The full write-up on the event's own page: plain text, blank lines between paragraphs. */
  description: optionalText(8000),
  /** The run of show, one line each, e.g. "7:00 Food". */
  agenda: z.array(text(120)).max(30),
  /** Hosts, speakers and co-hosting orgs, each optionally linked. */
  hosts: z.array(personInput).max(16),
  /** Photos from the night, for a recap once it's happened. */
  gallery: z.array(galleryImage).max(24),
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
  photo: optionalImage,
  /** What the hackathon is and why it's worth going. */
  description: optionalText(8000),
  /** How the group trip works: bus, where we stay, who to ask. */
  trip: optionalText(4000),
  /** Where to sign up for the trip (a form or a Discord post). */
  tripSignup: optionalUrl,
  gallery: z.array(galleryImage).max(24),
  ...flags,
})

export const winInput = z.object({
  project: text(80),
  blurb: optionalText(300),
  event: text(80),
  placement: text(60),
  /** The prize track or category, when it's not the placement itself (e.g. "Healthcare track"). */
  track: optionalText(80),
  team: z.array(personInput).max(12),
  photo: optionalImage,
  gallery: z.array(galleryImage).max(24),
  /** What they built and how: plain text, blank lines between paragraphs. */
  description: optionalText(8000),
  /** Languages, frameworks, hardware and APIs, one per item. */
  stack: z.array(text(40)).max(24),
  github: optionalUrl,
  devpost: optionalUrl,
  /** Any funding the project got, e.g. a Proto microgrant or a Spark! award. Optional. */
  funding: optionalText(200),
  /** Where the team is taking it next. Optional. */
  nextSteps: optionalText(4000),
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

/** GET /api/content/:resource/:id → { item }: one published row, or 404. */
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
  /** { name, href | null }[], stored as JSON: people with an optional link each */
  | 'people'
  /** string[] of image URLs or /paths, stored as JSON, shown with previews */
  | 'images'

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
      { key: 'text', column: 'text', label: 'Short description', type: 'textarea', hint: 'One or two lines for the events list and the home page.' },
      { key: 'photo', column: 'photo', label: 'Cover photo', type: 'image', hint: 'A full URL or a path under public/.' },
      { key: 'description', column: 'description', label: 'Full description', type: 'textarea', hint: 'For the event’s own page. Blank lines make paragraphs.' },
      { key: 'agenda', column: 'agenda', label: 'Schedule', type: 'list', hint: 'One line each, e.g. 7:00 Food, then 7:30 Kickoff.' },
      { key: 'hosts', column: 'hosts', label: 'Hosts and speakers', type: 'people', hint: 'People or orgs running it; each can link out.' },
      { key: 'gallery', column: 'gallery', label: 'Photos', type: 'images', hint: 'For a recap after the event.' },
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
      { key: 'photo', column: 'photo', label: 'Cover photo', type: 'image', hint: 'A full URL or a path under public/.' },
      { key: 'description', column: 'description', label: 'About the hackathon', type: 'textarea', hint: 'What it is and why it’s worth going. Blank lines make paragraphs.' },
      { key: 'trip', column: 'trip', label: 'How we’re going', type: 'textarea', hint: 'The group trip: getting there, where we stay, who to ask.' },
      { key: 'tripSignup', column: 'trip_signup', label: 'Trip sign-up link', type: 'url', hint: 'A form or post where people join the trip.' },
      { key: 'gallery', column: 'gallery', label: 'Photos', type: 'images' },
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
      { key: 'blurb', column: 'blurb', label: 'One line', type: 'textarea', hint: 'Shown on the card and under the title.' },
      { key: 'event', column: 'event', label: 'Hackathon', type: 'text' },
      { key: 'placement', column: 'placement', label: 'Placement', type: 'text', hint: 'e.g. 1st overall, 2nd place, Best hardware hack' },
      { key: 'track', column: 'track', label: 'Track or prize category', type: 'text', hint: 'Optional, e.g. Healthcare track, Best use of AI' },
      { key: 'team', column: 'team', label: 'Team', type: 'people', hint: 'Each name can link to a LinkedIn, personal site or GitHub.' },
      { key: 'photo', column: 'photo', label: 'Cover photo', type: 'image', hint: 'A full URL or a path under public/, e.g. /photos/pantry-pal.jpg' },
      { key: 'gallery', column: 'gallery', label: 'Photo gallery', type: 'images', hint: 'More photos for the project page.' },
      { key: 'description', column: 'description', label: 'What they built', type: 'textarea', hint: 'The problem, what it does and how it works. Blank lines make paragraphs.' },
      { key: 'stack', column: 'stack', label: 'Built with', type: 'list', hint: 'One technology per line, e.g. React, Python, Arduino.' },
      { key: 'github', column: 'github', label: 'GitHub link', type: 'url' },
      { key: 'devpost', column: 'devpost', label: 'Devpost link', type: 'url' },
      { key: 'funding', column: 'funding', label: 'Funding', type: 'text', hint: 'Optional, e.g. Proto microgrant ($250) or Spark! Ignite award.' },
      { key: 'nextSteps', column: 'next_steps', label: 'Where it’s going', type: 'textarea', hint: 'Optional: what the team is doing with it next.' },
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

/**
 * Placeholders the composer can insert into the subject or body; the Worker fills them in for
 * each recipient. A variable whose audience doesn't supply it (e.g. {{event}} in a members email)
 * renders empty, and the preview flags it. Anything else in braces is left as typed.
 */
export interface EmailVariable {
  token: string
  label: string
  /** Shown in the composer next to the token. */
  example: string
  /** Audience types that supply a value; absent means every audience. */
  audiences?: readonly EmailAudience['type'][]
}

export const EMAIL_VARIABLES: readonly EmailVariable[] = [
  { token: '{{name}}', label: 'First name', example: 'Ada' },
  { token: '{{fullName}}', label: 'Full name', example: 'Ada Lovelace' },
  { token: '{{email}}', label: 'Email', example: 'ada@bu.edu' },
  { token: '{{track}}', label: 'Track', example: 'Build', audiences: ['members', 'track'] },
  { token: '{{event}}', label: 'Event title', example: 'Why hackathons?', audiences: ['event'] },
  { token: '{{eventDate}}', label: 'Event date', example: 'Thu, Nov 12', audiences: ['event'] },
  { token: '{{eventTime}}', label: 'Event time', example: '6:30–8:30 PM', audiences: ['event'] },
  { token: '{{eventPlace}}', label: 'Event place', example: 'CDS, 665 Commonwealth Ave', audiences: ['event'] },
]

/**
 * POST /api/admin/email/preview → EmailPreview: the exact email one recipient would get,
 * rendered by the same template the send uses. `index` picks which recipient of the audience
 * (wrapping around), so the composer can step through real people. With nobody in the audience,
 * it renders for a sample recipient (`recipient.sample` true). Subject and body may be empty.
 */
export const previewEmailInput = z.object({
  audience: emailAudience,
  subject: optionalText(150),
  body: optionalText(20000),
  index: z.number().int().min(0).default(0),
})
export type PreviewEmailInput = z.input<typeof previewEmailInput>

export interface EmailPreview {
  subject: string
  /** The full HTML document; render it in a sandboxed iframe (srcdoc). */
  html: string
  text: string
  recipient: { name: string; email: string; sample: boolean }
  /** Which recipient this is, after wrapping, and how many there are. */
  index: number
  recipientCount: number
  /** Tokens used in the subject or body that this audience doesn't fill (they render empty). */
  unfilled: string[]
}

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

// ---- Portal: hackathon imports ----------------------------------------------------------------

/** Where imported hackathons come from. Both are fetched once a day by a Cron Trigger. */
export const IMPORT_SOURCES = ['mlh', 'devpost'] as const
export type ImportSource = (typeof IMPORT_SOURCES)[number]

export const CANDIDATE_STATUSES = ['new', 'added', 'dismissed'] as const
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

export const CANDIDATE_MODES = ['in-person', 'online', 'hybrid'] as const
export type CandidateMode = (typeof CANDIDATE_MODES)[number]

/** An upcoming hackathon an import found, waiting for review. */
export interface HackathonCandidate {
  id: number
  source: ImportSource
  sourceId: string
  name: string
  /** ISO days. */
  starts: string
  ends: string
  /** "Boston, MA", a venue name, or "Online". */
  location: string
  mode: CandidateMode
  url: string
  image: string | null
  status: CandidateStatus
  /** The draft it became, once added (null again if that hackathon is deleted). */
  hackathonId: number | null
  /** In New England, NY, NJ or PA by the location text. Devpost often only gives a venue, so it can miss. */
  nearBoston: boolean
  firstSeenAt: string
  lastSeenAt: string
}

/**
 * GET /api/admin/hackathon-imports?status=&mode=&near=1 → CandidateList
 * Hackathons that haven't ended, soonest first. `counts` are per status under the same filters.
 */
export const candidateQuery = z.object({
  status: z.enum(CANDIDATE_STATUSES).default('new'),
  mode: z.enum(CANDIDATE_MODES).optional(),
  near: z.enum(['1', 'true']).optional(),
})
export type CandidateQuery = z.input<typeof candidateQuery>

export interface CandidateList {
  items: HackathonCandidate[]
  counts: Record<CandidateStatus, number>
}

/** One source's import, scheduled or manual. `error` is null when it worked. */
export interface ImportRun {
  id: number
  source: ImportSource
  startedAt: string
  /** null while it's running. */
  finishedAt: string | null
  /** Upcoming events the source listed. */
  found: number
  /** Of those, how many weren't seen before. */
  new: number
  error: string | null
}

/**
 * GET /api/admin/hackathon-imports/runs → { items: ImportRun[] }: the last few runs per source, newest first.
 * POST /api/admin/hackathon-imports/run → 201 { items: ImportRun[] } (one per source), or 429 if a
 * run finished in the last 5 minutes.
 */
export const IMPORT_COOLDOWN_MINUTES = 5

/**
 * POST /api/admin/hackathon-imports/:id/add → 201 AddedCandidate. Creates an unpublished hackathon
 * with apply-by set to the start date; the admin fills in the rest in its editor.
 * POST .../:id/dismiss and .../:id/restore → { item: HackathonCandidate }.
 */
export interface AddedCandidate {
  item: Hackathon
  candidate: HackathonCandidate
}
