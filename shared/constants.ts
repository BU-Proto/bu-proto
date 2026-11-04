// Plain values shared by the site, the portal and the Worker. No zod here, so public pages can
// import these without shipping the validation library; shared/api.ts re-exports them.

export const CONTENT_RESOURCES = ['events', 'hackathons', 'wins', 'board'] as const
export type ContentResource = (typeof CONTENT_RESOURCES)[number]

export const EVENT_KINDS = ['Hack night', 'Why hackathons', 'Prep night', 'Panel', 'Workshop', 'Demo night'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export const YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Grad student', 'Other'] as const
export const TRACKS = ['Start', 'Build', 'Launch', 'Not sure yet'] as const
export type Track = (typeof TRACKS)[number]

export const FUND_AMOUNTS = ['$50–$100', '$100–$250', '$250–$500', 'Not sure yet'] as const

export const FUND_STATUSES = ['new', 'reviewing', 'approved', 'declined'] as const
export type FundStatus = (typeof FUND_STATUSES)[number]
