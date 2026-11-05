// The playbook index: every guide's title and one line. A written guide has a slug, and its text
// lives in `./guides`, loaded only on its own page. The playbook sits under the resources hub
// (`./resourcesHub.ts`), at /resources/playbook.

import { type Author, PLAYBOOK_AUTHORS } from './guides/authors'
import { guideHref, PLAYBOOK_HREF, SLUGS } from './guides/links'
import type { GuideImage } from './guides/types'
import { EYRIE, FLOWCAST, HEAR_ME_OUT, NEMO, winCover, winImage } from './guides/wins'
import { EVENT_COVERS, HACKATHON_COVER, type CoverPhoto } from './covers'
import type { PageIntro } from './types'

export { PLAYBOOK_HREF }

export const PLAYBOOK_INTRO: PageIntro = {
  path: '~/proto/resources/playbook',
  title: 'The playbook',
  lede: 'Everything we wish we’d known before our first hackathon, written down.',
}

export const CONTENTS_LABEL = 'Contents'

export interface Guide {
  title: string
  line: string
  /** Set once the guide is written: its page is `/resources/playbook/<slug>`. */
  slug?: string
  /** The written guide's lead photo, its byline and when it last changed. */
  lead?: {
    image: GuideImage
    authors: readonly Author[]
    /** `YYYY-MM`. */
    updated: string
  }
}

/** Commons serves fixed widths; 500px is enough for a thumbnail. */
function commons(photo: CoverPhoto): GuideImage {
  const { src, alt, author, license, source } = photo
  return { src, alt, thumb: src.replace('/1920px-', '/500px-'), credit: { author, license, source } }
}

function lead(image: GuideImage): NonNullable<Guide['lead']> {
  return { image, authors: PLAYBOOK_AUTHORS, updated: '2026-11' }
}

export const GUIDES: readonly Guide[] = [
  {
    title: 'How to win a hackathon',
    line: 'Plan first, pick an idea with an angle, aim at the tracks, use AI, polish the UI and practise the demo.',
    slug: SLUGS.win,
    lead: lead(winImage(FLOWCAST, '005/691/302/datas/original.png', 'Flowcast’s 3D model of BU’s campus beside the Charles, each building outlined by how busy it is')),
  },
  {
    title: 'Your first hackathon',
    line: 'What to bring, what to expect and how to survive the 3 AM wall.',
    slug: SLUGS.first,
    lead: lead(commons(HACKATHON_COVER)),
  },
  {
    title: 'Forming a team and splitting roles',
    line: 'Three or four people, split by layer, with the seams agreed in the first hour.',
    slug: SLUGS.team,
    lead: lead(commons(EVENT_COVERS.Workshop)),
  },
  {
    title: 'Finding an idea and an angle',
    line: 'Start from the tracks and sponsor prizes, then pick an angle that gives you a step up on the room.',
    slug: SLUGS.ideas,
    lead: lead(winCover(NEMO, 'Nemo’s tank experiment from above: a clear tray of water, a pump and a mesh collector')),
  },
  {
    title: 'Shipping fast',
    line: 'A stack you know, deployed before dinner, with everything that isn’t the point faked or cut.',
    slug: SLUGS.shipping,
    lead: lead(commons(EVENT_COVERS['Prep night'])),
  },
  {
    title: 'Demo and pitch tips',
    line: 'Three minutes, one story, a demo that works on the first try.',
    slug: SLUGS.demo,
    lead: lead(winImage(EYRIE, '003/818/149/datas/original.jpeg', 'Eyrie running on a laptop: a packed crowd on live video, with density readings underneath')),
  },
  {
    title: 'The write-up and the submission',
    line: 'The Devpost page, the video, the screenshots and every prize you honestly fit.',
    slug: SLUGS.writeUp,
    lead: lead(
      winCover(HEAR_ME_OUT, 'A page of Hear me Out’s notebook: sponsor tracks tallied, sticky notes on each sponsor, and notes on past winners'),
    ),
  },
  {
    title: 'How judging works',
    line: 'The criteria judges actually score, and how to aim for them.',
    slug: SLUGS.judging,
    lead: lead(commons(EVENT_COVERS.Panel)),
  },
  {
    title: 'After the weekend',
    line: 'The week after, whether to keep going, and where Proto’s tracks come in.',
    slug: SLUGS.after,
    lead: lead(commons(EVENT_COVERS['Demo night'])),
  },
  {
    title: 'Winning projects, broken down',
    line: 'Our ten wins: the angle, the track each one aimed at and what made the demo work.',
    slug: SLUGS.breakdowns,
    lead: lead(commons(EVENT_COVERS['Hack night'])),
  },
  { title: 'Starter templates', line: 'Repos that get you from zero to a deployed app in ten minutes.' },
  { title: 'Free credits', line: 'Student credits for cloud, APIs and AI models, and how to claim them.' },
  { title: 'Travel tips', line: 'Getting there cheap, sleeping somewhere and getting home in one piece.' },
]

export function guidePath(guide: Guide): string | undefined {
  return guide.slug ? guideHref(guide.slug) : undefined
}

/** Copy around a guide page. The guides themselves live in `./guides`. */
export const GUIDE_PAGE = {
  pathRoot: '~/proto/resources/playbook',
  contentsLabel: 'On this page',
  sections: (n: number) => `${n} sections`,
  exampleLabel: 'From our wins',
  by: 'By',
  and: 'and',
  updated: 'Updated',
  authorsTitle: 'About the authors',
  winsWith: 'Wins with Proto teams:',
  onTeam: (names: string) => `${names} ${names.includes(' and ') ? 'were' : 'was'} on this team.`,
  readTime: (minutes: number) => `${minutes} min read`,
  guideOf: (n: number, total: number) => `Guide ${n} of ${total}`,
  ruleOfThumb: 'Rule of thumb',
  featured: 'Start here',
  readGuide: 'Read the guide',
  comingSoon: 'Coming soon',
  stillWriting: 'Still being written',
  photoFrom: 'From the',
  writeUp: 'write-up',
  photoBy: 'Photo by',
  viaCommons: 'via Wikimedia Commons',
  navLabel: 'More guides',
  previous: 'Previous',
  upNext: 'Up next',
  backToStart: 'Back to the start',
  readNext: 'Read it',
  all: 'All guides',
  missing: {
    title: 'No guide here',
    text: 'That guide doesn’t exist, or hasn’t been written yet.',
    back: 'Back to the playbook',
  },
}
