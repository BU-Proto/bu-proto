// Projects members built and what they won. Every entry is a sample until we have real ones.

import type { PageIntro, Sampleable } from './types'

export const WINS_INTRO: PageIntro = {
  path: '~/proto/wins',
  title: 'Wins',
  lede: 'Things people built at hackathons, and what they took home.',
}

export interface Win extends Sampleable {
  project: string
  blurb: string
  event: string
  placement: string
  team: readonly string[]
  /** Path under public/, or null until there's a real photo. */
  photo: string | null
  devpost: string | null
}

export const WINS: readonly Win[] = [
  {
    placeholder: true,
    project: 'Pantry Pal',
    blurb: 'Snap your fridge, get three recipes that use what’s about to expire.',
    event: 'Sample Hackathon 2026',
    placement: '1st overall',
    team: ['Sample Student', 'Sample Student', 'Sample Student'],
    photo: null,
    devpost: null,
  },
  {
    placeholder: true,
    project: 'T-Tracker',
    blurb: 'A wall display that tells you when to leave for the Green Line.',
    event: 'Sample Hackathon 2026',
    placement: 'Best hardware hack',
    team: ['Sample Student', 'Sample Student'],
    photo: null,
    devpost: null,
  },
  {
    placeholder: true,
    project: 'Office Hours Queue',
    blurb: 'A fair, live queue for TA office hours, built in a weekend.',
    event: 'Sample Hackathon 2026',
    placement: '2nd place',
    team: ['Sample Student', 'Sample Student', 'Sample Student', 'Sample Student'],
    photo: null,
    devpost: null,
  },
  {
    placeholder: true,
    project: 'Signbridge',
    blurb: 'Live fingerspelling recognition from a laptop webcam.',
    event: 'Sample Hackathon 2026',
    placement: 'Best accessibility hack',
    team: ['Sample Student', 'Sample Student'],
    photo: null,
    devpost: null,
  },
  {
    placeholder: true,
    project: 'Lease Lens',
    blurb: 'Reads a Boston lease and flags the clauses worth asking about.',
    event: 'Sample Hackathon 2026',
    placement: '3rd place',
    team: ['Sample Student', 'Sample Student', 'Sample Student'],
    photo: null,
    devpost: null,
  },
  {
    placeholder: true,
    project: 'Quiet Room',
    blurb: 'Finds the emptiest study space on campus right now.',
    event: 'Sample Hackathon 2026',
    placement: 'Sponsor prize',
    team: ['Sample Student'],
    photo: null,
    devpost: null,
  },
]
