// A short guide for a first hackathon: what to bring, what happens and how to get through it.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { FLOWCAST } from './wins'

export const FIRST_HACKATHON: GuideDoc = {
  slug: SLUGS.first,
  standfirst:
    'A first hackathon is mostly about finishing something and getting through the night. Here’s what to bring, what happens over the weekend and what helps when it gets hard.',
  sections: [
    {
      id: 'before',
      title: 'Before you go',
      body: [
        {
          checklist: [
            'Apply early. Popular events fill up, and some accept in waves.',
            'Find a team of three or four if you can. If you can’t, most events run team-forming at the start, and plenty of teams form there.',
            'Read the schedule, the rules and the prize list. Note when submissions close and how judging works.',
            'Set up your laptop the night before: your editor, Git, Node or Python, and an account on Devpost or whatever the event uses for submissions.',
            'Agree with your team on a shared repo and a way to deploy, so nobody spends the first hour on setup.',
          ],
          title: 'Do this the week before',
        },
        {
          example: {
            win: FLOWCAST,
            text: 'Check the prize list for a beginner prize. Andres’s Flowcast team won Best First-Time Hacker at DS+X 2026, and many events have a prize like it.',
          },
        },
      ],
    },
    {
      id: 'bring',
      title: 'What to bring',
      body: [
        {
          list: [
            'Your laptop and charger, plus a phone charger. A small power strip makes you popular.',
            'Your student ID and any ID the event asked for.',
            'A water bottle, a hoodie (venues get cold at night) and headphones.',
            'For an overnight event: a toothbrush, deodorant, a change of clothes and something to sleep on or under.',
            'Any hardware you plan to use, with spare cables.',
          ],
        },
      ],
    },
    {
      id: 'what-happens',
      title: 'What happens',
      body: [
        { graphic: 'event-shape' },
        'Most hackathons follow the same shape: check-in, an opening ceremony where sponsors present their prizes, a long stretch of building with meals, workshops and mentors around, a submission deadline, then judging and a closing ceremony with the winners.',
        {
          list: [
            [{ strong: 'Go to the opening ceremony.' }, ' That’s where sponsors explain what they want. It’s the fastest way to find a prize to aim at.'],
            [{ strong: 'Visit the sponsor tables early.' }, ' Ask questions, get API keys and credits, and meet the people who’ll judge their prize.'],
            [{ strong: 'Use the mentors.' }, ' Asking for help when you’re stuck for 20 minutes saves you three hours.'],
          ],
        },
      ],
    },
    {
      id: 'the-wall',
      title: 'Getting through the night',
      body: [
        'Around 3 AM, almost everyone hits a wall: tired, stuck and sure the project won’t work. It passes. A few things help.',
        {
          list: [
            'Sleep a few hours if you can, in shifts if the team wants to keep going. A rested teammate fixes in ten minutes what a tired one breaks for an hour.',
            'Eat the real meals, drink water and take a walk outside.',
            'When you’re stuck, cut scope instead of pushing harder. A smaller thing that works beats a bigger thing that doesn’t.',
          ],
        },
      ],
    },
    {
      id: 'submitting',
      title: 'Submitting and after',
      body: [
        {
          list: [
            'Submit a draft well before the deadline, then edit it. Late submissions usually can’t be judged.',
            'Select every prize you qualify for when you submit.',
            'Push your code and make the repo public if the rules ask for it.',
            'Afterwards, write down what you’d do differently. Your second hackathon will be much better than your first.',
          ],
        },
        ['When you’re ready to go for prizes, read ', guideLink(SLUGS.win, 'How to win a hackathon'), '.'],
      ],
    },
  ],
}
