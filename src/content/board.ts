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

export const BOARD_EMPTY = 'The board is being put together. Check back soon.'
