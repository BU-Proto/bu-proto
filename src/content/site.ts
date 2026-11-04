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
  badge?: string
  /** Shown in the centered pill; everything is always in the menu sheet. */
  inPill?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Hackathons', to: '/hackathons', badge: '✦', inPill: true },
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

export const FOOTER = {
  note: 'BU Proto is a working name. Nothing here is official with Spark! or Innovate@BU yet.',
} as const
