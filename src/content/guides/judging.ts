// A short, honest guide to judging. Every event does it differently, so this sticks to the
// common shapes and points people at the rules.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { NEMO } from './wins'

export const JUDGING: GuideDoc = {
  slug: SLUGS.judging,
  standfirst:
    'Every hackathon runs judging its own way, and the rules page says how. Most follow one of a few shapes, and most score the same handful of things. Here’s what to expect, and how to plan the demo around it.',
  sections: [
    {
      id: 'formats',
      title: 'The usual formats',
      body: [
        'Read the rules page before the weekend. Most events use one of two shapes, or both in rounds.',
        {
          list: [
            [{ strong: 'Expo or science-fair style.' }, ' Every team stays at a table and judges walk round, spending a few minutes with each. The best teams in the first round are often asked to present again to a panel or on stage.'],
            [{ strong: 'Presentations to a panel.' }, ' Each team gets a short slot, often a few minutes for the demo and a minute or two for questions.'],
          ],
        },
        'Sponsor prizes are usually judged separately, by the sponsor’s own people, against their own brief. They may visit your table, read your submission or both.',
      ],
    },
    {
      id: 'criteria',
      title: 'What gets scored',
      body: [
        'The exact rubric varies, but most events score some mix of these. Many publish theirs, so look for it.',
        {
          facts: [
            { term: 'Technical difficulty', detail: 'How hard it was to build, and how much of it you built this weekend.' },
            { term: 'Originality', detail: 'Whether it’s a new idea or a new angle on an old one.' },
            { term: 'Design and usability', detail: 'How it looks, and how easy it is to understand and use.' },
            { term: 'Impact', detail: 'Whether it solves a real problem for real people.' },
            { term: 'Completeness', detail: 'Whether it works, live, in front of the judge.' },
          ],
        },
      ],
    },
    {
      id: 'aim',
      title: 'How to aim for it',
      body: [
        {
          checklist: [
            'Read the rubric and the prize descriptions, and plan the demo so each criterion gets a clear answer.',
            'Assume each judge sees many projects. Make the first 30 seconds count: the problem, then the one-sentence pitch.',
            'Stay at your table during judging, with the demo loaded. A judge who finds an empty table moves on.',
            'Tell judges which prizes you’re going for. It helps them score you in the right frame.',
            'Write the submission for the judge who reads it later, not just the one who sees you live.',
          ],
          title: 'Do this',
        },
        { graphic: 'scorecard' },
        {
          example: {
            win: NEMO,
            text: 'Placed third overall and won the ASUS Sustainability track with the same project. Where the rules allow it, one strong project can be judged for several prizes at once.',
          },
        },
        ['For the demo itself, read ', guideLink(SLUGS.demo, 'Demo and pitch tips'), '.'],
      ],
    },
  ],
}
