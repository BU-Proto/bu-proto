// Plain values shared by the site, the portal and the Worker. No zod here, so public pages can
// import these without shipping the validation library; shared/api.ts re-exports them.

export const CONTENT_RESOURCES = ['events', 'hackathons', 'wins', 'board', 'roles'] as const
export type ContentResource = (typeof CONTENT_RESOURCES)[number]

/**
 * Every kind of event, the community's own first. Hack night, Why hackathons and Prep night are
 * the CS group's, Pitch night the Business group's (content/events.ts says so on the page);
 * everyone is welcome at all of them.
 */
export const EVENT_KINDS = ['Build night', 'Fireside', 'Social', 'Demo night', 'Workshop', 'Panel', 'Hack night', 'Why hackathons', 'Prep night', 'Pitch night'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export const YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Grad student', 'Not a student', 'Other'] as const

/** What a member builds from: the groups Proto has or plans, and the rest. */
export const FIELDS = ['Business', 'Engineering', 'Computer science', 'Design', 'Science', 'Something else'] as const
export type Field = (typeof FIELDS)[number]
export const TRACKS = ['Start', 'Build', 'Launch', 'Not sure yet'] as const
export type Track = (typeof TRACKS)[number]

export const FUND_AMOUNTS = ['$50–$100', '$100–$250', '$250–$500', 'Not sure yet'] as const

/** The open board seats people can put themselves forward for, plus "Not sure yet". */
export const BOARD_SEATS = ['Head of Partnerships', 'Head of the Fund', 'Head of Community', 'Head of Scouting', 'Not sure yet'] as const
export type BoardSeat = (typeof BOARD_SEATS)[number]

export const FUND_STATUSES = ['new', 'reviewing', 'approved', 'declined'] as const
export type FundStatus = (typeof FUND_STATUSES)[number]

/** Where an application for a role stands. Our own triage: the applicant isn't told by the site. */
export const APPLICATION_STATUSES = ['new', 'reviewing', 'accepted', 'declined'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

/** The most questions of its own a role can ask on its application. */
export const MAX_ROLE_QUESTIONS = 5

/** An application's résumé: a PDF of at most this many bytes (5 MB). */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024

/** The most an uploaded picture may weigh once the portal has shrunk it (1.5 MB): D1 holds 2 MB in one value. */
export const UPLOAD_MAX_BYTES = 1.5 * 1024 * 1024
/** The longest side, in pixels, the portal shrinks an uploaded picture to before sending it. */
export const UPLOAD_MAX_SIDE = 1600
export const RESUME_TYPE = 'application/pdf'

/**
 * Where an ask stands: drafted and not sent yet, sent and waiting for a reply, answered, or
 * closed (done, or dropped). Answered and closed are a teammate's call: replies go to their inbox.
 */
export const ASK_STATUSES = ['draft', 'waiting', 'answered', 'closed'] as const
export type AskStatus = (typeof ASK_STATUSES)[number]

/**
 * The name a remembered answer is saved under, from Claude's question: "Who is Proto's faculty
 * advisor?" → "Proto's faculty advisor". Only a suggestion: the teammate sees it, and can pick an
 * existing fact's name instead, so the answer updates that fact rather than sitting beside it.
 */
export function factLabelFor(question: string): string {
  const bare = question
    .replace(/\?\s*$/, '')
    .replace(/^(what|who|which|where|when)(['’]s|\s+(is|are|was|were))\s+(the\s+)?/i, '')
    .trim()
  return (bare.charAt(0).toUpperCase() + bare.slice(1) || question).slice(0, 80)
}

/** The BroadcastChannel the admin sign-in pop-up reports its result on. */
export const AUTH_CHANNEL = 'proto-auth'
