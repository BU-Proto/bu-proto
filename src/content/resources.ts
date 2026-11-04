// The playbook index: every guide's title and one line. A written guide has a slug, and its text
// lives in `./guides`, loaded only on its own page.

import { guideHref, SLUGS } from './guides/links'
import type { PageIntro } from './types'

export const RESOURCES_INTRO: PageIntro = {
  path: '~/proto/resources',
  title: 'The playbook',
  lede: 'Everything we wish we’d known before our first hackathon, written down.',
}

export const CONTENTS_LABEL = 'Contents'

export interface Guide {
  title: string
  line: string
  /** Set once the guide is written: its page is `/resources/<slug>`. */
  slug?: string
}

export const GUIDES: readonly Guide[] = [
  {
    title: 'How to win a hackathon',
    line: 'Plan first, pick an idea with an angle, aim at the tracks, use AI, polish the UI and practise the demo.',
    slug: SLUGS.win,
  },
  { title: 'Your first hackathon', line: 'What to bring, what to expect and how to survive the 3 AM wall.', slug: SLUGS.first },
  {
    title: 'Finding an idea and an angle',
    line: 'Start from the tracks and sponsor prizes, then pick an angle that gives you a step up on the room.',
    slug: SLUGS.ideas,
  },
  { title: 'Demo and pitch tips', line: 'Three minutes, one story, a demo that works on the first try.', slug: SLUGS.demo },
  { title: 'How judging works', line: 'The criteria judges actually score, and how to aim for them.', slug: SLUGS.judging },
  { title: 'Starter templates', line: 'Repos that get you from zero to a deployed app in ten minutes.' },
  { title: 'Free credits', line: 'Student credits for cloud, APIs and AI models, and how to claim them.' },
  { title: 'Travel tips', line: 'Getting there cheap, sleeping somewhere and getting home in one piece.' },
  {
    title: 'Winning projects, broken down',
    line: 'Our ten wins: the angle, the track each one aimed at and what made the demo work.',
    slug: SLUGS.breakdowns,
  },
]

export function guidePath(guide: Guide): string | undefined {
  return guide.slug ? guideHref(guide.slug) : undefined
}

/** Copy around a guide page. The guides themselves live in `./guides`. */
export const GUIDE_PAGE = {
  pathRoot: '~/proto/resources',
  contentsLabel: 'On this page',
  exampleLabel: 'From our wins',
  navLabel: 'More guides',
  previous: 'Previous',
  next: 'Next',
  all: 'All guides',
  missing: {
    title: 'No guide here',
    text: 'That guide doesn’t exist, or hasn’t been written yet.',
    back: 'Back to the playbook',
  },
}
