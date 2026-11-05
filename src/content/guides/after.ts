// After the weekend: what to do in the week after, whether to keep going, and where Proto fits.
// The fund isn't open: it's only ever "coming soon" here, as on /grants.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { ECOAPI, FLOWCAST, HEAR_ME_OUT, NEMO, winImage } from './wins'

export const AFTER: GuideDoc = {
  slug: SLUGS.after,
  standfirst:
    'Most hackathon projects stop on Sunday afternoon, and that’s fine: the weekend did its job. A few are worth keeping going. This is what we do in the week after, how we decide which projects to keep, and where Proto comes in.',
  sections: [
    {
      id: 'the-week-after',
      title: 'The week after',
      body: [
        'Do these while you still remember how everything works. A week later, half of them never happen.',
        {
          checklist: [
            'Push the final code, make the repo public if the team agrees, and write a README with a screenshot, the one sentence and how to run it.',
            'Update the write-up: the prize, if you won one, and anything you fixed after judging, marked as after.',
            'Keep the live link up for a few weeks. Free hosting tiers often sleep or expire, so check it from a fresh browser.',
            'Connect with your teammates, the mentors who helped and the sponsor engineers you talked to.',
            'Write down three things you’d do differently. That list is the start of your next weekend.',
          ],
          title: 'Do this',
        },
      ],
    },
    {
      id: 'keep-or-stop',
      title: 'Keep it, or let it go',
      body: [
        'Winning a prize doesn’t mean a project should keep going, and losing doesn’t mean it shouldn’t. Ask four questions, honestly, as a team.',
        {
          steps: [
            [{ strong: 'Did anyone outside the team want it?' }, ' A judge asking when they can use it, a sponsor asking for the repo, a friend asking for a link.'],
            [{ strong: 'Would you use it yourself?' }, ' Next week, without a prize on the line.'],
            [{ strong: 'Is the hard part real?' }, ' If the core was faked for the demo, the next step is building it, and that’s a different kind of project.'],
            [{ strong: 'Does anyone want to keep working on it?' }, ' One person with time beats four with good intentions.'],
          ],
        },
        { callout: 'If nobody can name a next step that fits in one week, let it go and take what you learned to the next hackathon.' },
      ],
    },
    {
      id: 'next-steps',
      title: 'Write the next steps down',
      body: [
        'Our wins’ write-ups almost all end with where the project could go next. The useful ones are specific: a feature, a test, a group of people to try it with. These are plans, in the teams’ own words, not results.',
        {
          figure: winImage(FLOWCAST, '005/691/298/datas/original.png', 'Flowcast’s 3D campus at night, one building outlined, with a panel listing the least crowded libraries'),
          caption: 'Flowcast’s live campus. Its write-up plans to bring it to other universities, since every input is something most campuses already publish.',
        },
        {
          example: {
            win: FLOWCAST,
            text: 'Lists five next steps, from adding BU’s employees and visitors as a separate, labelled layer to showing uncertainty as a range instead of a single number.',
          },
        },
        'A good next step is something one person can pick up on a Tuesday night. “Grow the user base” isn’t.',
        {
          example: {
            win: ECOAPI,
            text: 'Plans to release the project as open source, so other hackers can cut their costs and their footprint.',
          },
        },
        {
          example: {
            win: NEMO,
            text: 'Plans blind tests with known sources, where the true source stays hidden until Nemo saves its answer, and every outcome stays visible, including wrong answers and “Unknown”.',
          },
        },
      ],
    },
    {
      id: 'portfolio',
      title: 'Make it count on your résumé',
      body: [
        'Even a project you stop working on is worth something, if someone can see it. A recruiter gives it a minute. Make that minute easy.',
        {
          list: [
            'One line on your résumé: what it does, the prize and event, and the part you built. “Built the live video pipeline” says more than “worked on a team”.',
            'Link to the write-up and the repo, not just the project name.',
            'A short GIF of the demo path at the top of the README. Most people won’t run it.',
            'Be ready to explain every part you claim. Interviewers ask about hackathon projects, and “the AI wrote that” is a weak answer.',
          ],
        },
        { pull: 'Be ready to explain every part you claim.' },
      ],
    },
    {
      id: 'with-proto',
      title: 'Where Proto comes in',
      body: [
        'Proto exists for the part after the weekend as much as the weekend itself. There are three ways in, and you can move between them whenever you like.',
        {
          facts: [
            { term: 'Start', detail: 'Beginner workshops, and first-hackathon squads paired with a veteran. For anyone without a project yet.' },
            { term: 'Build', detail: 'Weekly hack nights with food, team matching and group trips to hackathons. Where a project from the weekend gets its second and third evening.' },
            {
              term: 'Launch',
              detail: [
                'Demo nights, founder talks and a path into BU’s startup programs, Spark! and Innovate@BU. For a project that’s turning into something more. ',
                { label: 'What each one does', href: '/resources#around-bu' },
                '.',
              ],
            },
          ],
        },
        [
          'Every semester there’s a demo night, and anyone can show anything. ',
          { label: 'See what’s coming up', href: '/events' },
          ', or ',
          { label: 'join Proto', href: '/join' },
          '.',
        ],
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The write-up ends with a long list of where the game could go, from starting a round inside the group chat to an event mode where a whole room splits into tables. That kind of list is exactly what to bring to a hack night.',
          },
        },
        {
          label: 'Microgrants, coming soon',
          callout: [
            'We’re working on small grants, $50 to $500, so money is never the reason someone skips a hackathon: travel, registration, API credits and hardware. The fund isn’t open yet and nobody can apply, but ',
            { label: 'the grants page', href: '/grants' },
            ' explains the plan and lets you tell us you’d use it.',
          ],
        },
      ],
    },
    {
      id: 'the-next-one',
      title: 'Go again',
      body: [
        'Your second hackathon will be better than your first, as long as it comes while the lessons are fresh. Go again within a month or two, and take the list of things you’d do differently with you.',
        ['Before you do, read how our ten wins came together in ', guideLink(SLUGS.breakdowns, 'Winning projects, broken down'), '.'],
      ],
    },
  ],
}
