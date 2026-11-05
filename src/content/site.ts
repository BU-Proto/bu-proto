// Copy shared by every page: the brand, the navigation and hack night's time and place.

import type { Sampleable } from './types'

export const BRAND = {
  /** Short name for the top bar and inside sentences that already say BU. */
  short: 'Proto',
  full: 'BU Proto',
  seal: '/proto-seal.svg',
} as const

export interface NavItem {
  label: string
  to: string
  /** Shown in the centered pill; everything is always in the menu sheet. */
  inPill?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Hackathons', to: '/hackathons', inPill: true },
  { label: 'Grants', to: '/grants', inPill: true },
  { label: 'Wins', to: '/wins', inPill: true },
  { label: 'Resources', to: '/resources', inPill: true },
  { label: 'Events', to: '/events', inPill: true },
  { label: 'Track Record', to: '/track-record' },
  { label: 'Board', to: '/board' },
  { label: 'Join', to: '/join' },
]

export interface ScheduleSlot {
  day: string
  level: string
  start: string
  end: string
  duration: string
}

/** Hack night's room and times aren't booked yet. */
export const SCHEDULE: { location: string; slots: readonly ScheduleSlot[] } & Sampleable = {
  placeholder: true,
  location: 'CDS, 665 Commonwealth Ave, Boston',
  slots: [
    { day: 'Thursdays', level: 'All levels', start: '7:00 PM', end: '10:00 PM', duration: '3h' },
    { day: 'Nov 12', level: 'All tracks', start: '6:30 PM', end: '8:30 PM', duration: '2h' },
  ],
}

/**
 * BU Proto's LinkedIn page. Paste the full URL here (e.g. 'https://www.linkedin.com/company/…')
 * once the page exists; while it's null, the board page and the footer leave the link out.
 */
export const PROTO_LINKEDIN: string | null = null

export interface FooterGroup {
  title: string
  links: readonly { label: string; to: string }[]
}

export const FOOTER = {
  line: 'Hack nights, hackathon trips and demo nights for BU students who make things.',
  note: 'BU Proto is a working name. Nothing here is official with Spark! or Innovate@BU yet.',
  /** The site, sorted into columns. Legal links come from LEGAL_LINKS, the email from CONTACT_EMAIL. */
  groups: [
    {
      title: 'Explore',
      links: [
        { label: 'Events', to: '/events' },
        { label: 'Hackathons', to: '/hackathons' },
        { label: 'Playbook', to: '/resources' },
      ],
    },
    {
      title: 'Our record',
      links: [
        { label: 'Wins', to: '/wins' },
        { label: 'Track record', to: '/track-record' },
        { label: 'Board', to: '/board' },
      ],
    },
    {
      title: 'Get involved',
      links: [
        { label: 'Join Proto', to: '/join' },
        { label: 'Grants', to: '/grants' },
      ],
    },
  ] satisfies readonly FooterGroup[],
} as const

/** What a page shows while its content loads, or when it couldn't. */
export const ROUTE_STATES = {
  loading: 'Loading…',
  error: {
    title: 'Couldn’t load this right now',
    text: 'Something went wrong on our end or the connection dropped. Give it another try in a moment.',
    retry: 'Try again',
  },
} as const

/** The photo viewer every gallery opens into. */
export const LIGHTBOX = {
  label: 'Photo viewer',
  close: 'Close',
  previous: 'Previous photo',
  next: 'Next photo',
  scrollBack: 'Scroll back through the photos',
  scrollOn: 'Scroll on through the photos',
} as const
