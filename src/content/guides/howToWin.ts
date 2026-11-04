// The guide the playbook leads with: how we approach a hackathon to win, in the order we do it.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { ECOAPI, EYRIE, FLOWCAST, HEAR_ME_OUT, NEMO, NOOGIE, SPLIT_WORLD, SUPER_ARTIFICIAL_BROS, winCover, winImage } from './wins'

export const HOW_TO_WIN: GuideDoc = {
  slug: SLUGS.win,
  standfirst:
    'Most teams lose before they write a line of code. They pick an idea in five minutes, split up, build for 30 hours and find out at 9 AM that nothing joins together and nobody knows what they’re showing. Winning teams do the same amount of work in a different order.',
  sections: [
    {
      id: 'short-version',
      title: 'The short version',
      body: [
        'This is the order we work in. Between the two of us, it’s how the Proto teams we were on won prizes at HackHarvard, HackIllinois, PennApps, Cal Hacks, YHack, Civic Hacks and DS+X.',
        {
          steps: [
            [{ strong: 'Plan your approach' }, ' before anyone opens an editor.'],
            [{ strong: 'Pick a great idea with an angle,' }, ' something a judge remembers an hour later.'],
            [{ strong: 'Read the tracks and prizes' }, ' and aim at them on purpose.'],
            [{ strong: 'Use AI to code and design,' }, ' without shame and with judgement.'],
            [{ strong: 'Treat UI and UX as part of the build,' }, ' not the last hour.'],
            [{ strong: 'Practise the demo' }, ' until it’s boring.'],
          ],
        },
      ],
    },
    {
      id: 'plan',
      title: '1. Plan your approach first',
      body: [
        'The first hour decides the weekend. Spend it on paper, not in code. By the end of it everyone on the team should be able to answer four questions the same way: what are we building, what will the judges see, who’s doing what, and what has to work by when.',
        {
          checklist: [
            [{ strong: 'Write the demo first.' }, ' Three sentences: what the judge sees on screen, what happens when you click, why it matters. This is your spec. Anything not in it is optional.'],
            [{ strong: 'Cut the scope to one flow.' }, ' One user, one path, start to finish. Login, settings and an admin page are not that flow. Fake them or skip them.'],
            [{ strong: 'Split roles by layer.' }, ' For example: one person on the interface, one on the backend and data, one on the hard part (the model, the hardware, the sponsor API), one on design, the write-up and the pitch. Agree on the data shapes between you early so the pieces fit.'],
            [{ strong: 'Set checkpoints.' }, ' Something ugly running end to end by the halfway mark. A feature freeze a few hours before submissions close. The last stretch is for polish, the video, the write-up and practice.'],
            [{ strong: 'Decide what you’ll fake.' }, ' Seed data, a hard-coded account, a recorded input. Judges care that the core idea works, not that your sign-up form does.'],
          ],
          title: 'Do this in the first hour',
        },
        ['How we split roles, including with teammates we just met, is in ', guideLink(SLUGS.team, 'Forming a team and splitting roles'), '.'],
        { callout: 'If it isn’t in the demo, it doesn’t exist. Plan backwards from the three minutes you’ll have in front of the judges.' },
        {
          figure: winImage(HEAR_ME_OUT, '005/692/847/datas/original.png', 'A handwritten notebook page listing seven numbered ideas, with notes in red beside each'),
          caption: 'The ideas page from Hear me Out’s Notability notebook: seven directions, each with a note on why it might not work.',
          shape: 'tall',
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The team kept their whole plan in a notebook. It starts with the track requirements and a look at past projects, then seven ideas written down with why each one might not work. They dropped a hardware idea and started again before settling on a party game. They kept all of it in Notability, the sponsor whose prize they went on to win.',
          },
        },
      ],
    },
    {
      id: 'idea',
      title: '2. Pick a great idea with an angle',
      body: [
        'A good idea solves a real problem you can say in one sentence. A great idea also has an angle: the thing that makes it stand out from the other hundred projects in the room. Hardware, a real social problem, a tool other developers want, a clever use of a sponsor’s product, a striking design. The angle is what a judge remembers when they’re comparing notes later.',
        'Look for problems that already happened to someone, ideally to you. A specific story beats a general category every time.',
        {
          list: [
            'Bad: “an app to help students study.” Good: “a tutor that builds a map of what you know, then makes you teach it back.”',
            'Bad: “a sustainability dashboard.” Good: “how much your vibe-coded app is costing you, in dollars and in electricity.”',
          ],
        },
        {
          example: {
            win: ECOAPI,
            text: 'The idea came from two real moments: someone at a hackathon getting their API key revoked for sending 200 requests at once, and a professor talking about a data center planned for Champaign. The team put them together into a developer tool that shows what your API calls cost and what they burn.',
          },
        },
        { pull: 'A specific story beats a general category every time.' },
        ['The full method, with every angle we’ve seen work, is in ', guideLink(SLUGS.ideas, 'Finding an idea and an angle'), '.'],
      ],
    },
    {
      id: 'tracks',
      title: '3. Read the tracks and aim at them',
      body: [
        'Most of the prizes at a big hackathon aren’t overall placements. They’re tracks and sponsor prizes: best use of a company’s API, best sustainability hack, best design, best beginner team. Fewer teams go after each one, and the judges for each tell you exactly what they want in the prize description.',
        {
          checklist: [
            'Read every track and sponsor prize before the event starts. Write each one down with what it asks for, in its own words.',
            'Choose one prize to aim at first and one or two more that your idea fits without bending.',
            'Visit the sponsor tables early. Ask what they’d love to see built with their product, and ask for credits or API keys while the line is short.',
            'Make the sponsor’s tech central, not a logo on a slide. If their product disappeared, your demo should break.',
            'Say the sponsor’s product by name in your demo and in your write-up.',
            'Submit to every prize you honestly qualify for. It costs nothing, and the rules usually let one project win more than one.',
          ],
          title: 'Do this',
        },
        { callout: 'Judges for “best use of” prizes work for the company. They know their product better than you do, and they can tell when it was bolted on at 4 AM.' },
        {
          example: {
            win: NEMO,
            text: 'One project, two prizes: Third Place Overall and the ASUS Sustainability track. The team built around ocean pollution, which made the sustainability track a natural fit rather than a stretch.',
          },
        },
        {
          example: {
            win: EYRIE,
            text: 'A crowd-crush early warning system: a YOLOv8 model finds heads in live video to measure how tightly a crowd is packed, with Cloudflare in the stack. The prize asked for an AI application built with Cloudflare, and Eyrie was squarely both.',
          },
        },
      ],
    },
    {
      id: 'ai',
      title: '4. Use AI to code and design',
      body: [
        'Don’t be afraid to use AI. Every team around you is using it, and judges score what you ship, not how you typed it. Use it to scaffold the project, learn an SDK you’ve never touched, draft screens, write seed data and chase bugs. A weekend is short. Spend your own attention on the idea, the hard part and the demo.',
        'Use it with judgement, though. You have to be able to explain every part of your project to a judge who asks. AI is fastest when it has context and slowest when it’s guessing.',
        {
          checklist: [
            'Give it the real context: the file, the full error message, what you expected and what happened instead.',
            'Ask for two or three design directions for a screen, then pick one and stick to it.',
            'Have it read unfamiliar docs with you, then check the parts that matter in the docs yourself.',
            'Check what it writes against the code, the data and a quick test before you build on top of it.',
            'Don’t let it pick your idea. It’ll give you the same idea it gives everyone else.',
          ],
          title: 'Good habits',
        },
        {
          example: {
            win: SPLIT_WORLD,
            text: 'Built inside Snap’s Lens Studio with Claude Code as the main copilot, connected through Cursor. AI let the team iterate fast on a platform they were learning that weekend. When it hit Lens Studio’s limits, they had to slow down, read the docs and reason it out. Their lesson: depth of understanding matters more than speed.',
          },
        },
        {
          example: {
            win: SUPER_ARTIFICIAL_BROS,
            text: 'The team found that vague requests got generic answers. Things got better once they gave the AI specific code, error messages and the gap between what they saw and what they expected.',
          },
        },
        ['The stack, the deploy and what to fake are in ', guideLink(SLUGS.shipping, 'Shipping fast'), '.'],
      ],
    },
    {
      id: 'design',
      title: '5. UI and UX make or break the demo',
      body: [
        'Judges meet your project for a few minutes, on a screen. They judge what they see. A clean, calm interface reads as “this works” before you’ve said a word, and a cluttered one makes a strong backend look unfinished.',
        {
          checklist: [
            'Give one person the look of the project for the whole weekend, even if they also code.',
            'Choose one font, one accent colour and one spacing scale in the first few hours. Consistency looks designed.',
            'Design the demo path first: the three or four screens you’ll actually show. Nothing else needs to be pretty.',
            'Use real-looking data. Lorem ipsum and “Test User 1” make a project look like a template.',
            'Handle loading and empty states on the demo path, so nobody stares at a blank screen or a spinner.',
            'Make text big enough for a projector, and try the demo on the screen you’ll present on.',
          ],
          title: 'Do this',
        },
        {
          figure: winCover(NOOGIE, 'World news drawn as clusters of coloured nodes on a dark background'),
          caption: 'noogie, which won Best Design at PennApps XXVI. The idea is something you can see before anyone explains it.',
        },
        {
          example: {
            win: NOOGIE,
            text: 'A news platform that shows world stories as clusters of connected nodes, drawn with d3.js, so you can see the different sides of a story at a glance. It won Best Design: the main idea was something you could see.',
          },
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'Their notebook shows the design work: two early looks tested against the user journey, eight unexplained reaction icons cut down to three labeled ones, and the controls redrawn as one matching set.',
          },
        },
      ],
    },
    {
      id: 'practice',
      title: '6. Practise the demo',
      body: [
        'A demo that works on the first try in front of judges has usually worked twenty times in front of the team. Freeze features early enough that you have time to rehearse, and treat the rehearsal as part of the build.',
        {
          checklist: [
            'Run the whole demo out loud, start to finish, at least three times. Time it.',
            'Choose who presents early. It shouldn’t be the person still pushing commits five minutes before judging.',
            'Run it on the deployed version, from a fresh account, on the venue Wi-Fi. That’s what the judges will see.',
            'Load the demo state ahead of time: the account signed in, the data seeded, the tabs open in order.',
            'Record a backup video of the demo working, in case the live one doesn’t.',
            'Know your first sentence and your last sentence by heart.',
          ],
          title: 'Before judging',
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'Before judging, the team played the deployed game end to end with three separate players, from joining a room all the way to the RSVPs.',
          },
        },
        {
          example: {
            win: FLOWCAST,
            text: 'On demo day, new Google sign-ins were landing on the wrong page because a database table from a new feature had never been migrated. They caught it, fixed the schema and replaced the silent failure with a clear error screen. That’s the kind of bug you only find by running the real thing.',
          },
        },
        ['How to structure the three minutes themselves is in ', guideLink(SLUGS.demo, 'Demo and pitch tips'), '.'],
      ],
    },
    {
      id: 'weekend',
      title: 'A weekend, in order',
      body: [
        'Every hackathon runs a little differently, but the shape is the same whether it’s 24 hours or 36.',
        { graphic: 'weekend' },
        {
          steps: [
            [{ strong: 'Before the event:' }, ' read the tracks and prizes, form the team, set up a repo and a way to deploy.'],
            [{ strong: 'The first hour or two:' }, ' idea, angle, target prize, the demo in three sentences, roles, checkpoints.'],
            [{ strong: 'The first quarter:' }, ' the skeleton running end to end and deployed, even if every screen is ugly.'],
            [{ strong: 'Halfway:' }, ' the demo path works. Now make the hard part real.'],
            [{ strong: 'The last third:' }, ' polish the demo path and fix what’s broken. No new features.'],
            [{ strong: 'The last few hours:' }, ' feature freeze, the backup video, the write-up, then practise the demo until it’s boring.'],
          ],
        },
        ['Every one of our wins, and why it won, is in ', guideLink(SLUGS.breakdowns, 'Winning projects, broken down'), '.'],
      ],
    },
  ],
}
