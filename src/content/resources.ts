// The playbook index. Titles and one line each for now; the guides themselves come later.

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
  /** Set once the guide is written. */
  href?: string
}

export const GUIDES: readonly Guide[] = [
  { title: 'Your first hackathon', line: 'What to bring, what to expect and how to survive the 3 AM wall.' },
  { title: 'Picking an idea', line: 'How to find something small enough to finish and good enough to demo.' },
  { title: 'Demo and pitch tips', line: 'Three minutes, one story, a demo that works on the first try.' },
  { title: 'How judging works', line: 'The criteria judges actually score, and how to aim for them.' },
  { title: 'Starter templates', line: 'Repos that get you from zero to a deployed app in ten minutes.' },
  { title: 'Free credits', line: 'Student credits for cloud, APIs and AI models, and how to claim them.' },
  { title: 'Travel tips', line: 'Getting there cheap, sleeping somewhere and getting home in one piece.' },
  { title: 'Winning projects, broken down', line: 'Past winners, what made them work and what they’d change.' },
]
