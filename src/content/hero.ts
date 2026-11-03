// Placeholder copy for the BU Builders home page. Swap freely; the layout adapts.

export interface NavItem {
  label: string
  href: string
  current?: boolean
  badge?: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '#', current: true },
  { label: 'Hackathons', href: '#hackathons', badge: '✦' },
  { label: 'Grants', href: '#grants' },
  { label: 'Wins', href: '#wins' },
]

export interface ScheduleSlot {
  day: string
  level: string
  start: string
  end: string
  duration: string
}

export const SCHEDULE: { location: string; slots: readonly ScheduleSlot[] } = {
  location: 'CDS, 665 Commonwealth Ave, Boston',
  slots: [
    { day: 'Thursdays', level: 'All levels', start: '7:00 PM', end: '10:00 PM', duration: '3h' },
    { day: 'Nov 14', level: 'Build track', start: '6:00 PM', end: '8:00 PM', duration: '2h' },
  ],
}

export const HERO_COPY = {
  headline: ['Your Home Base', 'for Making Things'],
  lede:
    'Weekly hack nights, funded trips to hackathons, and $50–$500 microgrants approved within a week. One club, three ways in: Start, Build, Launch.',
  primaryCta: { label: 'Join the club', href: '#join' },
  secondaryCta: { label: 'See hack nights', href: '#hack-nights' },
} as const

export type FeatureIconName = 'hackNight' | 'trips' | 'grants' | 'demo' | 'handoff'

export interface Feature {
  icon: FeatureIconName
  text: string
}

export const FEATURES: readonly Feature[] = [
  { icon: 'hackNight', text: 'Weekly hack night, open to everyone, with food' },
  { icon: 'trips', text: 'Group trips to HackMIT, PennApps and more' },
  { icon: 'grants', text: 'Microgrants of $50–$500, approved in a week' },
  { icon: 'demo', text: 'One demo night each semester, anyone can show' },
  { icon: 'handoff', text: 'Direct handoff to Innovate@BU and Spark!' },
]
