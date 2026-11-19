// Plain values shared by the site, the portal and the Worker. No zod here, so public pages can
// import these without shipping the validation library; shared/api.ts re-exports them.

export const CONTENT_RESOURCES = ['events', 'hackathons', 'wins', 'board', 'roles'] as const
export type ContentResource = (typeof CONTENT_RESOURCES)[number]

export const EVENT_KINDS = ['Hack night', 'Why hackathons', 'Prep night', 'Panel', 'Workshop', 'Demo night'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export const YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Grad student', 'Other'] as const
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

/** The source of a form answer a teammate typed themselves. A redraft keeps these over Claude's. */
export const TYPED_SOURCE = 'typed in the portal'

/** The BroadcastChannel the admin sign-in pop-up reports its result on. */
export const AUTH_CHANNEL = 'proto-auth'
