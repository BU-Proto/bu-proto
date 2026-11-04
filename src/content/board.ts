// The people running Proto. Every card is a sample until the board is set.

import type { Link, PageIntro, Sampleable } from './types'

export const BOARD_INTRO: PageIntro = {
  path: '~/proto/board',
  title: 'The board',
  lede: 'The students who run hack nights, book the buses and answer your messages.',
}

export interface BoardMember extends Sampleable {
  name: string
  role: string
  /** Path under public/, or null to show initials. */
  photo: string | null
  links: readonly Link[]
}

export const BOARD: readonly BoardMember[] = [
  { placeholder: true, name: 'Sample Person', role: 'President', photo: null, links: [] },
  { placeholder: true, name: 'Sample Person', role: 'Start track lead', photo: null, links: [] },
  { placeholder: true, name: 'Sample Person', role: 'Build track lead', photo: null, links: [] },
  { placeholder: true, name: 'Sample Person', role: 'Launch track lead', photo: null, links: [] },
  { placeholder: true, name: 'Sample Person', role: 'Trips and travel', photo: null, links: [] },
  { placeholder: true, name: 'Sample Person', role: 'Sponsorships', photo: null, links: [] },
]
