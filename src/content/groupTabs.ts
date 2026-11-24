// The tabs under each group: its overview and the pages that belong to it. Shown as a bar at the
// top of every one of those pages, so a page always says which group it's part of.

import type { GroupSlug } from './groups'

export interface GroupTab {
  label: string
  to: string
}

export const GROUP_TABS: Record<GroupSlug, { name: string; tone: 'iris' | 'amber'; tabs: readonly GroupTab[] }> = {
  cs: {
    name: 'CS',
    tone: 'iris',
    tabs: [
      { label: 'Overview', to: '/cs' },
      { label: 'Hackathons', to: '/hackathons' },
      { label: 'Wins', to: '/wins?group=cs' },
      { label: 'Playbook', to: '/resources/playbook' },
      { label: 'Grants', to: '/grants' },
    ],
  },
  business: {
    name: 'Business',
    tone: 'amber',
    tabs: [
      { label: 'Overview', to: '/business' },
      { label: 'Pitch competitions', to: '/pitch-competitions' },
      { label: 'Wins', to: '/wins?group=business' },
      { label: 'Playbook', to: '/business/playbook' },
    ],
  },
}

export const GROUP_TABS_LABEL = (name: string) => `The ${name} group's pages`
