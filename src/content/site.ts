// Copy shared by every page: the brand, the navigation and build night's time and place.

import type { Sampleable } from './types'

export const BRAND = {
  /** The name, everywhere: the top bar, the footer, tab titles. */
  name: 'Proto',
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

/**
 * Proto is one community with groups inside it. CS is the first group: hackathons and everything
 * that goes with them live under it. Business is the second: pitch nights, customers and funding.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'About',
    to: '/about',
    inPill: true,
    children: [
      { label: 'What we offer', to: '/about#offer', line: 'Build nights, firesides and demo night' },
      { label: 'The board', to: '/board', line: 'Who runs Proto, and the open seats' },
      { label: 'Roles', to: '/roles', line: 'The seats we\'re filling, and how to apply' },
    ],
  },
  { label: 'Events', to: '/events', inPill: true },
  {
    label: 'Groups',
    to: '/cs',
    inPill: true,
    children: [
      { label: 'CS', to: '/cs', line: 'Hack nights, hackathons, the playbook and its wins' },
      { label: 'Business', to: '/business', line: 'Pitch nights, pitch competitions, the playbook and its wins' },
    ],
  },
  {
    label: 'Resources',
    to: '/resources',
    inPill: true,
    children: [
      { label: 'Around Boston', to: '/resources#boston-wide', line: 'Founder events open to anyone in the city' },
      { label: 'Spark!', to: '/resources/spark', line: 'BU\'s lab for building things, with mentors' },
      { label: 'Innovate@BU', to: '/resources/innovate', line: 'Funding and mentors to launch a venture' },
    ],
  },
  { label: 'Track Record', to: '/track-record' },
  { label: 'Join', to: '/join' },
]

/**
 * Every event is open to everyone. A group's own nights say whose they are, and that everyone else
 * is welcome too: "CS group, everyone welcome".
 */
export const groupInvite = (group: string) => `${group} group, everyone welcome`

/** Whether the page at `pathname` is one of an item's own pages (a child's hash doesn't count). */
export const navItemHolds = (item: NavItem, pathname: string) =>
  [item, ...(item.children ?? [])].some((child) => child.to.split('#')[0] === pathname)

/** The name of the section a path is in (Events for /events/12), for a page still loading. */
export function sectionName(pathname: string): string | undefined {
  const section = `/${pathname.split('/')[1] ?? ''}`
  for (const item of NAV_ITEMS) {
    if (item.to === pathname || item.to === section) return item.label
    const child = item.children?.find((c) => c.to === pathname || c.to === section)
    if (child) return child.label
  }
  return undefined
}

export interface ScheduleSlot {
  day: string
  level: string
  start: string
  end: string
  duration: string
}

/** Build night's room and times aren't booked yet. */
export const SCHEDULE: { location: string; slots: readonly ScheduleSlot[] } & Sampleable = {
  placeholder: true,
  location: 'CDS, 665 Commonwealth Ave, Boston',
  slots: [
    { day: 'Thursdays', level: 'All levels', start: '7:00 PM', end: '10:00 PM', duration: '3h' },
    { day: 'Nov 12', level: 'All tracks', start: '6:30 PM', end: '8:30 PM', duration: '2h' },
  ],
}

/**
 * Proto's LinkedIn page. Paste the full URL here (e.g. 'https://www.linkedin.com/company/…')
 * once the page exists; while it's null, the board page and the footer leave the link out.
 */
export const PROTO_LINKEDIN: string | null = null

export interface FooterGroup {
  title: string
  links: readonly { label: string; to: string }[]
}

export const FOOTER = {
  line: 'A home in Boston for anyone who wants to build something. Started at BU, open to every school.',
  note: 'Proto is a working name. Nothing here is official with Spark! or Innovate@BU yet.',
  /** The site, sorted into columns. Legal links come from LEGAL_LINKS, the email from CONTACT_EMAIL. */
  groups: [
    {
      title: 'Explore',
      links: [
        { label: 'About Proto', to: '/about' },
        { label: 'Events', to: '/events' },
        { label: 'Wins', to: '/wins' },
        { label: 'Track record', to: '/track-record' },
      ],
    },
    {
      title: 'Groups',
      links: [
        { label: 'CS', to: '/cs' },
        { label: 'Business', to: '/business' },
        { label: 'Hackathons', to: '/hackathons' },
        { label: 'Pitch competitions', to: '/pitch-competitions' },
      ],
    },
    {
      title: 'Get involved',
      links: [
        { label: 'Join Proto', to: '/join' },
        { label: 'Roles', to: '/roles' },
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
