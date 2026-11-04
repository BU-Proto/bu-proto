// Copy for the board page. The members themselves live in D1 and are edited in the portal at
// /admin; each one is a sample until the board is set.

import { CONTACT_EMAIL } from './legal'
import type { PageIntro } from './types'

export const BOARD_INTRO: PageIntro = {
  path: '~/proto/board',
  title: 'The board',
  lede: 'Proto is run by BU students who build things themselves. They plan the hack nights, book the trips and find the sponsors, and they read every message.',
}

export const BOARD_CONTACT = {
  lead: 'Questions, sponsorships or a project you want to pitch:',
  email: CONTACT_EMAIL,
  linkedin: 'Follow BU Proto on LinkedIn',
} as const

/** While there's no board yet: what it's for, the roles being filled, and how to put your hand up. */
export const BOARD_FORMING = {
  title: 'The first board is forming',
  text: 'We’re picking the people who’ll run Proto this year. If one of these sounds like you, tell us what you’d take on.',
  rolesLabel: 'Roles we’re filling',
  roles: [
    { role: 'President', detail: 'Sets the plan for the year and keeps it moving.' },
    { role: 'Start track lead', detail: 'Workshops and first-hackathon squads for people just starting.' },
    { role: 'Build track lead', detail: 'Hack nights, team matching and the regulars.' },
    { role: 'Launch track lead', detail: 'Demo nights, founder talks and the path into BU’s startup programs.' },
    { role: 'Trips and travel', detail: 'Getting groups to hackathons and home again.' },
    { role: 'Sponsorships', detail: 'Finding the companies that fund hack nights, trips and the fund.' },
  ],
  cta: 'Put your hand up',
  subject: 'Joining the BU Proto board',
} as const
