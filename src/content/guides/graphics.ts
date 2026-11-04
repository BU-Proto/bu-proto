// The numbers and words behind the guides' diagrams. Each one restates what its guide's text
// already says, drawn so it can be taken in at a glance. The components that draw them live in
// `src/components/guide/Graphics.tsx`.

import { BREAKDOWN_ANCHORS } from './breakdowns'
import type { WinRef } from './types'
import {
  ECOAPI,
  EYRIE,
  FLOWCAST,
  HEAR_ME_OUT,
  NEMO,
  NOOGIE,
  SAPLING,
  SPLIT_WORLD,
  STALK_MARKET,
  SUPER_ARTIFICIAL_BROS,
} from './wins'

export interface Span {
  label: string
  from: number
  to: number
  note: string
}

/** How to win: the weekend, from the guide's "A weekend, in order", as hours of a 36-hour event. */
export const WEEKEND = {
  title: 'A 36-hour weekend, hour by hour',
  caption:
    'Drawn for an event that runs from 9 PM Friday to 9 AM Sunday. Yours may be shorter or start earlier; stretch or squeeze the bars and keep the order.',
  hours: 38,
  days: [
    { label: 'Fri', from: 0, to: 3 },
    { label: 'Saturday', from: 3, to: 27 },
    { label: 'Sunday', from: 27, to: 38 },
  ],
  ticks: [0, 6, 12, 18, 24, 30, 36],
  phases: [
    { label: 'Plan', from: 0, to: 2, note: 'Idea, angle, target prize, the demo in three sentences, roles.' },
    { label: 'Skeleton', from: 2, to: 9, note: 'Something ugly running end to end, and deployed.' },
    { label: 'The hard part', from: 9, to: 24, note: 'The demo path works by halfway. Then make the hard part real.' },
    { label: 'Polish', from: 24, to: 31, note: 'Polish the demo path and fix what’s broken. No new features.' },
    { label: 'Practise', from: 31, to: 36, note: 'The backup video, the write-up, the demo out loud until it’s boring.' },
    { label: 'Judging', from: 36, to: 38, note: 'Show it.' },
  ] satisfies Span[],
  /** `row` staggers the labels so neighbours don't collide. */
  milestones: [
    { at: 9, label: 'End to end', row: 0 },
    { at: 18, label: 'Demo path works', row: 1 },
    { at: 31, label: 'Feature freeze', row: 0 },
    { at: 36, label: 'Submit', row: 2 },
  ],
}

/** Demo: the three minutes from "Three minutes, in order", in seconds. */
export const DEMO_CLOCK = {
  title: 'Three minutes, in seconds',
  caption: 'The demo gets half the time. The demo moment should land inside the first minute, before anyone mentions the stack.',
  seconds: 180,
  segments: [
    { label: 'The problem', from: 0, to: 20, note: 'One real story or one real number. Who has this problem, and why does it hurt?' },
    { label: 'The pitch', from: 20, to: 30, note: 'Your one sentence.' },
    {
      label: 'The demo',
      from: 30,
      to: 120,
      note: 'One user, one path, start to finish. Narrate what the judge is seeing, not what the code is doing.',
    },
    { label: 'How it works', from: 120, to: 150, note: 'The one or two technical things you’re proudest of. Name the sponsor tech.' },
    { label: 'What’s next', from: 150, to: 170, note: 'One line on where it goes, then thank them and stop.' },
  ] satisfies Span[],
  spare: { label: 'Spare', note: 'Ten seconds for the thing that goes wrong.' },
  moment: { from: 30, to: 60, label: 'The demo moment lands here' },
}

/** First hackathon: the shape of the weekend from "What happens". `long` stretches a stop. */
export const EVENT_SHAPE = {
  title: 'The shape of almost every hackathon',
  caption: 'Most of the weekend is one long stretch of building. The parts at either end are short, and they’re where the prizes are explained and won.',
  stops: [
    { label: 'Check-in', note: 'Badge, swag, a table.' },
    { label: 'Opening', note: 'Sponsors explain their prizes. Go.' },
    { label: 'Building', note: 'Meals, workshops and mentors around you. The wall comes around 3 AM, and passes.', long: true },
    { label: 'Submit', note: 'A draft early, then edit. Late usually can’t be judged.' },
    { label: 'Judging', note: 'Stay at your table with the demo loaded.' },
    { label: 'Closing', note: 'The winners.' },
  ],
}

/** Judging: which part of the three-minute demo answers each criterion. */
export const SCORECARD = {
  title: 'Where each criterion gets its answer',
  caption: 'Plan the demo against the rubric. Every criterion should have a moment in the three minutes that answers it.',
  parts: ['The problem', 'The pitch', 'The demo', 'How it works'],
  markLabel: 'Answered here',
  rows: [
    { criterion: 'Impact', answers: ['The problem'] },
    { criterion: 'Originality', answers: ['The pitch'] },
    { criterion: 'Completeness', answers: ['The demo'] },
    { criterion: 'Design and usability', answers: ['The demo'] },
    { criterion: 'Technical difficulty', answers: ['How it works'] },
  ],
}

/** Ideas: every angle in the guide, and the wins that used it, from each win's breakdown. */
export const ANGLES = {
  title: 'Our ten wins, mapped by angle',
  caption: (stacked: number, total: number) =>
    `${stacked} of the ${total} sit on more than one angle. An angle can be the frame around another idea, not only the idea itself.`,
  totalLabel: 'Wins',
  angles: [
    { id: 'hardware', label: 'Hardware', wins: [NEMO] },
    { id: 'social-good', label: 'Social good', wins: [NEMO, EYRIE, FLOWCAST] },
    { id: 'dev-tools', label: 'Dev tools', wins: [ECOAPI] },
    { id: 'sponsor-tech', label: 'Sponsor tech', wins: [EYRIE, HEAR_ME_OUT, SPLIT_WORLD] },
    { id: 'ai-twist', label: 'AI with a twist', wins: [HEAR_ME_OUT, SAPLING, SUPER_ARTIFICIAL_BROS] },
    { id: 'design-first', label: 'Design-first', wins: [NOOGIE] },
    { id: 'education', label: 'Education', wins: [SAPLING, STALK_MARKET] },
    { id: 'sustainability', label: 'Sustainability', wins: [NEMO, ECOAPI] },
    { id: 'beginner-prizes', label: 'Beginner prizes', wins: [FLOWCAST] },
  ] satisfies { id: string; label: string; wins: WinRef[] }[],
}

/** Winning projects: the ten, each linking to its breakdown further down the page. */
export const WIN_INDEX = {
  title: 'The ten, at a glance',
  caption: 'Each one links to its breakdown below.',
  wins: BREAKDOWN_ANCHORS,
}
