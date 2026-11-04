// The join page.

import type { PageIntro, Sampleable, TrackName } from './types'

export const JOIN_INTRO: PageIntro = {
  path: '~/proto/join',
  title: 'Join Proto',
  lede: 'Free, no application, no experience needed. Tell us who you are and which track fits, and we’ll see you at hack night.',
}

export const PERKS: readonly { title: string; text: string }[] = [
  { title: 'A weekly hack night', text: 'Somewhere to build every week, with food and people to ask.' },
  { title: 'A team', text: 'Matching for hackathons, and a veteran for your first one.' },
  { title: 'A seat on the bus', text: 'Group trips to hackathons, about once a month.' },
  { title: 'A stage', text: 'Demo night every semester. Show anything, finished or not.' },
  { title: 'First word on the fund', text: 'Members hear first when microgrants open.' },
]

export const YEAR_OPTIONS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Grad student', 'Other'] as const

export const TRACK_OPTIONS: readonly (TrackName | 'Not sure yet')[] = ['Start', 'Build', 'Launch', 'Not sure yet']

/** The Discord server doesn't exist yet; set `href` and drop the flag when it does. */
export const DISCORD: { label: string; text: string; href: string | null } & Sampleable = {
  placeholder: true,
  label: 'Join the Discord',
  text: 'Where hack night plans, team matching and trip sign-ups happen.',
  href: null,
}

export const JOIN_THANKS = {
  title: 'You’re in',
  text: 'Thanks for joining. We’ll email you before the next hack night.',
} as const

export const JOIN_FORM = {
  perksTitle: 'What you get',
  title: 'Sign up',
  submit: 'Join Proto',
  discordPending: 'Invite link coming',
} as const
