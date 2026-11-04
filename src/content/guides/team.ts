// Forming a team and splitting the work, including with people you met an hour ago.
// The team facts come from the teams listed on each win's page.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { FLOWCAST, HEAR_ME_OUT, NOOGIE, STALK_MARKET, winImage } from './wins'

export const TEAM: GuideDoc = {
  slug: SLUGS.team,
  standfirst:
    'The team decides more of the weekend than the idea does. Every one of the eight wins we were on mixed BU students with people from other schools. Here’s how we form a team, split the work and get people who met an hour ago shipping by the first evening.',
  sections: [
    {
      id: 'size',
      title: 'Three or four people',
      body: [
        'Nine of our ten wins were teams of three or four. That’s the size most events allow, and it’s the size that works: enough hands for a front end, a back end and the hard part, few enough that everyone knows what everyone else is doing.',
        {
          list: [
            [{ strong: 'Two' }, ' can win, but one of you ends up doing the pitch, the design and the write-up on top of half the code.'],
            [{ strong: 'Three' }, ' is the smallest team that can split by layer and still have someone look up from the code.'],
            [{ strong: 'Four' }, ' lets one person own the design, the write-up and the pitch for the whole weekend. That person is often why a team places.'],
            [{ strong: 'Five or more,' }, ' where it’s allowed, needs a plan for who decides. Flowcast was a team of five, and its write-up splits the build into eight separate parts, from the data pipeline to the hosting.'],
          ],
        },
      ],
    },
    {
      id: 'finding',
      title: 'Finding people',
      body: [
        'The best time to form a team is the week before. The second best is the team-forming session at the start, and plenty of good teams come out of it.',
        {
          checklist: [
            'Come to a Proto hack night before the event. The Build track does team matching, and a team that has eaten pizza together once has a head start.',
            'Post in the event’s Slack or Discord before it starts: what you build, what you want to build, and which prizes you’re looking at.',
            'Look for someone who finishes things. A shipped side project, however small, says more than a long list of languages.',
            'Aim for a mix: someone happy in the interface, someone happy with data and servers, and someone who will talk to judges without being asked.',
            'If you’re new, say so. Teams going for a beginner prize need you, and veterans on a first-hackathon squad expect you.',
          ],
          title: 'Do this',
        },
        { pull: 'Look for someone who finishes things.' },
      ],
    },
    {
      id: 'first-fifteen',
      title: 'The first fifteen minutes with strangers',
      body: [
        'A team of strangers loses most of its time to things nobody said out loud: one person wants to win, another wants to learn Rust, a third plans to sleep eight hours. Say them before you pick an idea.',
        {
          steps: [
            [{ strong: 'What have you shipped?' }, ' Everyone shows one thing they’ve built, on their laptop, in a minute. You learn more from that than from any list of skills.'],
            [{ strong: 'What do you want from this weekend?' }, ' A prize, a new language, a portfolio piece, a fun night. All fine, as long as everyone knows.'],
            [{ strong: 'How long can you stay up?' }, ' Plan sleep shifts now, not at 3 AM.'],
            [{ strong: 'How do we decide?' }, ' Agree that once the idea is picked, it stays picked, and that the person who owns a layer makes the calls in it.'],
          ],
        },
        {
          example: {
            win: STALK_MARKET,
            text: 'The team’s write-up says that, except for one of them, it was the first time they had worked together at a hackathon. What they took away was time management and organization, and the project won Best Technical Execution.',
          },
        },
      ],
    },
    {
      id: 'roles',
      title: 'Split by layer, not by feature',
      body: [
        'Split the project by layer, so each person owns one part from start to finish and nobody is waiting for someone else’s branch to merge. Feature splits sound fair but put four people in the same files.',
        {
          facts: [
            { term: 'Front end', detail: 'The screens in the demo path, on fake data first, then on the real thing. Usually the person who drives the laptop in judging.' },
            { term: 'Back end and data', detail: 'The API, the database, the seed data and the deploy. Keeps the deployed version working while everyone else changes things.' },
            { term: 'The hard part', detail: 'The model, the hardware, the sponsor’s SDK: whatever makes the project worth judging. Starts on day one, because it’s the part most likely to fail.' },
            { term: 'Design and pitch', detail: 'The prize list, the one sentence, the look, the write-up and the three minutes. Codes too, but owns how the project comes across.' },
          ],
        },
        'With three people, the design and pitch role usually goes to whoever owns the front end. With two, the person on the hard part often owns the back end too. Either way, write the names down.',
        { graphic: 'roles' },
      ],
    },
    {
      id: 'seams',
      title: 'Agree on the seams early',
      body: [
        'The parts of a hackathon project rarely fail on their own. They fail where they join. Spend twenty minutes in the first hour agreeing on the seams, and nobody spends Saturday night rewriting someone else’s code to fit.',
        {
          checklist: [
            'Write down the data shapes that cross between layers, with one real example of each. A shared JSON file in the repo is enough.',
            'Put the front end on that example data straight away, so it can be built before the back end exists.',
            'One repo, one main branch that always runs, and short-lived branches merged often. Merging every few hours beats one big merge at 4 AM.',
            'Decide where it’s deployed in the first hour, and deploy something ugly before dinner.',
            'Keep one shared note with the plan, the checkpoints and the open questions, so a teammate who was asleep can catch up in a minute.',
          ],
          title: 'In the first hour',
        },
        {
          figure: winImage(FLOWCAST, '005/690/068/datas/original.png', 'Three phone screens from Flowcast, each showing the 3D campus map with a different time and panel'),
          caption: 'Flowcast’s phone screens. The team designed the interface in Figma before writing code, and the colours and type from that file became shared design tokens, so the dashboard and the 3D map look like one product.',
          shape: 'tall',
        },
        ['More on getting the skeleton deployed early is in ', guideLink(SLUGS.shipping, 'Shipping fast'), '.'],
      ],
    },
    {
      id: 'check-ins',
      title: 'Check in, briefly, every few hours',
      body: [
        'Every three or four hours, stop for five minutes. Each person says what works now, what they’re stuck on and what they’ll do next. Then compare it with the checkpoints from the plan.',
        { callout: 'Stuck for twenty minutes means ask a teammate. Stuck for an hour means cut it, fake it or hand it to someone else.' },
        {
          example: {
            win: NOOGIE,
            text: 'The team’s write-up says the workload was distributed equally among the three of them, and that they learned d3.js, TypeScript and Supabase along the way. The project won Best Design at PennApps.',
          },
        },
      ],
    },
    {
      id: 'when-it-goes-wrong',
      title: 'When it goes wrong',
      body: [
        'Something will. The teams that win aren’t the ones where nothing goes wrong. They’re the ones that notice early and change the plan.',
        {
          list: [
            [{ strong: 'Two people want different ideas.' }, ' Go back to the prize list and the demo moment. Whichever idea has the clearer three minutes wins, and the decision stays made.'],
            [{ strong: 'Someone disappears.' }, ' Give them an hour, then move their part to whoever is ahead. No hard feelings, and no waiting.'],
            [{ strong: 'A layer is far behind.' }, ' Cut it down to what the demo needs and fake the rest. A teammate can pair on it for an hour.'],
            [{ strong: 'Everyone is exhausted.' }, ' Sleep in shifts. A rested teammate fixes in ten minutes what a tired one breaks in an hour.'],
          ],
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The team dropped their first plan, built on Meta Ray-Bans, because the glasses were too hard to charge and would have taken too long, and started the brainstorm again on sticky notes. Changing course early is a team decision, and it’s cheaper on Friday night than on Saturday.',
          },
        },
        ['For how the team’s work fits together hour by hour, see ', guideLink(SLUGS.win, 'How to win a hackathon'), ', and every team behind our wins is listed on ', { label: 'the wins page', href: '/wins' }, '.'],
      ],
    },
  ],
}
