// A short, honest guide to judging. Every event does it differently, so this sticks to the
// common shapes and points people at the rules.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { HEAR_ME_OUT, NEMO, winImage } from './wins'

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
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The team talked with judges during the weekend and wrote down when they did, along with the tracks they switched to afterwards. Sponsor judges are often around before judging starts, and they’ll tell you what they’re looking for.',
          },
        },
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
        'You can’t change the rubric, but you can make every line of it easy to score. Plan the three minutes so each criterion has a moment that answers it.',
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
      ],
    },
    {
      id: 'questions',
      title: 'The questions judges ask',
      body: [
        'Most judging slots end with questions, and the same few come up again and again. Have a short, true answer ready for each, and decide who on the team answers which.',
        {
          list: [
            [{ strong: '“What did you build this weekend?”' }, ' Say exactly what’s new and what came from a library, a template or before the event.'],
            [{ strong: '“What was the hardest part?”' }, ' One specific problem and how you got past it. This is where technical difficulty gets scored.'],
            [{ strong: '“Who would use this?”' }, ' A real group of people, as specific as you can make it.'],
            [{ strong: '“What’s faked?”' }, ' Tell them straight away. A judge who finds it themselves stops trusting the rest.'],
            [{ strong: '“What would you do next?”' }, ' One or two concrete steps, not a roadmap.'],
          ],
        },
        { pull: 'A judge who finds it themselves stops trusting the rest.' },
        {
          figure: winImage(NEMO, '005/606/749/datas/original.png', 'A diagram of Nemo: the tank camera and NOAA current data feed a comparison that ranks the likely sources'),
          caption: 'A diagram like Nemo’s answers “how does it work?” in one picture. Keep one open in a tab for the questions.',
        },
        ['For the demo itself, read ', guideLink(SLUGS.demo, 'Demo and pitch tips'), ', and for the page judges read, ', guideLink(SLUGS.writeUp, 'The write-up and the submission'), '.'],
      ],
    },
  ],
}
