// The portal's map: one list the sidebar, the top bar's trail, the section tabs and the command
// menu all read, so a page is named and found the same way everywhere.

import type { ComponentType, SVGProps } from 'react'
import { CalendarIcon, CodeIcon, CoinIcon, HomeIcon, KeyIcon, MailIcon, PeopleIcon, SeatIcon, SheetIcon, TrophyIcon } from './components/icons'

export type Icon = ComponentType<SVGProps<SVGSVGElement>>

export interface NavTab {
  to: string
  label: string
  /** What the command menu calls it, when the tab's own label needs its section to make sense. */
  command?: string
}

export interface NavItem {
  to: string
  label: string
  icon: Icon
  /** Only the exact path counts as this page (the overview, or every page would light it). */
  end?: boolean
  /** Pages inside the section, shown as tabs under its heading. The first is the section itself. */
  tabs?: readonly NavTab[]
  /** Something new in this section, for the command menu ("New event"). */
  create?: { to: string; label: string }
}

export interface NavGroup {
  label?: string
  items: readonly NavItem[]
}

// Grouped the way people think about the portal: what's on the site, who's signed up, who runs it.
export const NAV: readonly NavGroup[] = [
  { items: [{ to: '/admin', label: 'Overview', icon: HomeIcon, end: true }] },
  {
    label: 'Site',
    items: [
      {
        to: '/admin/events',
        label: 'Events',
        icon: CalendarIcon,
        tabs: [
          { to: '/admin/events', label: 'All events' },
          { to: '/admin/events/import', label: 'Import', command: 'Import an event' },
        ],
        create: { to: '/admin/events/new', label: 'New event' },
      },
      {
        to: '/admin/hackathons',
        label: 'Hackathons',
        icon: CodeIcon,
        tabs: [
          { to: '/admin/hackathons', label: 'All hackathons' },
          { to: '/admin/hackathons/import', label: 'Import', command: 'Import hackathons' },
        ],
        create: { to: '/admin/hackathons/new', label: 'New hackathon' },
      },
      {
        to: '/admin/wins',
        label: 'Wins',
        icon: TrophyIcon,
        tabs: [
          { to: '/admin/wins', label: 'All wins' },
          { to: '/admin/wins/import', label: 'Import', command: 'Import a win' },
        ],
        create: { to: '/admin/wins/new', label: 'New win' },
      },
      {
        to: '/admin/board',
        label: 'Board',
        icon: SeatIcon,
        tabs: [
          { to: '/admin/board', label: 'Board members' },
          { to: '/admin/board/interest', label: 'Interest', command: 'Board interest' },
        ],
        create: { to: '/admin/board/new', label: 'New board member' },
      },
      {
        to: '/admin/roles',
        label: 'Roles',
        icon: SheetIcon,
        tabs: [
          { to: '/admin/roles', label: 'All roles' },
          { to: '/admin/roles/applications', label: 'Applications', command: 'Role applications' },
        ],
        create: { to: '/admin/roles/new', label: 'New role' },
      },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/members', label: 'Members', icon: PeopleIcon },
      { to: '/admin/fund', label: 'Fund', icon: CoinIcon },
      {
        to: '/admin/email',
        label: 'Email',
        icon: MailIcon,
        tabs: [
          { to: '/admin/email', label: 'Compose' },
          { to: '/admin/email/automatic', label: 'Automatic', command: 'Automatic emails' },
        ],
      },
    ],
  },
  { label: 'Portal', items: [{ to: '/admin/admins', label: 'Admins', icon: KeyIcon }] },
]

export const NAV_ITEMS: readonly NavItem[] = NAV.flatMap((group) => group.items)

const within = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`)

/** The sidebar section a path belongs to. */
export function sectionFor(pathname: string): NavItem | undefined {
  const path = pathname.replace(/\/+$/, '') || '/admin'
  return NAV_ITEMS.find((item) => (item.end ? path === item.to : within(path, item.to)))
}

/** The tab a path is on, when it's one of its section's inner pages (not the section's own list). */
export function innerTabFor(pathname: string): NavTab | undefined {
  const path = pathname.replace(/\/+$/, '')
  return sectionFor(path)
    ?.tabs?.slice(1)
    .find((tab) => tab.to === path)
}
