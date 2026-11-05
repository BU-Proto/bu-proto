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
  /**
   * Pages grouped under this item. In the pill it becomes a button that opens them as a menu; in
   * the menu sheet they're listed under it. Each has a short line saying what's there.
   */
  children?: readonly NavChild[]
}

export interface NavChild {
  label: string
  to: string
  line: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'About',
    to: '/about',
    inPill: true,
    children: [
      { label: 'About Proto', to: '/about', line: 'What Proto is and why it exists' },
      { label: 'What we offer', to: '/about#offer', line: 'Hack nights, trips and the playbook' },
      { label: 'The board', to: '/board', line: 'Who runs Proto, and the open seats' },
    ],
  },
  { label: 'Hackathons', to: '/hackathons', inPill: true },
  { label: 'Grants', to: '/grants', inPill: true },
  { label: 'Wins', to: '/wins', inPill: true },
  {
    label: 'Resources',
    to: '/resources',
    inPill: true,
    children: [
      { label: 'All resources', to: '/resources', line: 'The playbook, and where to go at BU' },
      { label: 'The playbook', to: '/resources/playbook', line: 'Our guides to hackathons, start to finish' },
      { label: 'Spark! and Innovate@BU', to: '/resources#around-bu', line: 'BU’s programs for building and launching' },
    ],
  },
  { label: 'Events', to: '/events', inPill: true },
  { label: 'Track Record', to: '/track-record' },
  { label: 'Join', to: '/join' },
]

/** Whether the page at `pathname` is one of an item's own pages (a child's hash doesn't count). */
export const navItemHolds = (item: NavItem, pathname: string) =>
  (item.children ?? [item]).some((child) => child.to.split('#')[0] === pathname)

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
        { label: 'About Proto', to: '/about' },
        { label: 'The board', to: '/board' },
        { label: 'Events', to: '/events' },
        { label: 'Hackathons', to: '/hackathons' },
        { label: 'Playbook', to: '/resources/playbook' },
        { label: 'Resources at BU', to: '/resources#around-bu' },
      ],
    },
    {
      title: 'Our record',
      links: [
        { label: 'Wins', to: '/wins' },
        { label: 'Track record', to: '/track-record' },
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
