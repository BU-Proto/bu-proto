// Shipping fast: the stack, the deploy, what to fake and what to cut. Stack facts come from the
// "built with" list on each win's page; the rest from the teams' write-ups.

import { guideHref, guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { ECOAPI, FLOWCAST, HEAR_ME_OUT, NEMO, SUPER_ARTIFICIAL_BROS, winImage } from './wins'

export const SHIPPING: GuideDoc = {
  slug: SLUGS.shipping,
  standfirst:
    'The teams that win don’t write the most code. They have something running end to end and deployed by Saturday morning, they fake everything that isn’t the point, and they spend the last hours on the demo instead of a feature nobody will see. This is how we ship in a weekend.',
  sections: [
    {
      id: 'before',
      title: 'Set up before you arrive',
      body: [
        'Every minute of setup at the event is a minute not spent on the idea. Do the boring parts at home, the week before, while it’s still calm.',
        {
          checklist: [
            'A starter repo with your usual stack, a working dev server and one deployed page. Clone it on Friday instead of starting from nothing.',
            'Accounts on whatever you deploy to, with the CLI installed and signed in on every laptop.',
            'Student credits claimed for the cloud and AI providers you’re likely to use. Some take days to come through.',
            'A test API key for every sponsor you might aim at, if they hand them out before the event.',
            'Check the rules on code written before the event. Most allow open-source libraries and templates, and most want the project itself built at the event.',
          ],
          title: 'The week before',
        },
      ],
    },
    {
      id: 'stack',
      title: 'Use the stack you already know',
      body: [
        'A hackathon is a bad place to learn a framework and a good place to learn one API. Build on what the team already knows, and spend your one new thing on the part that wins the prize: the sponsor’s SDK, the model, the hardware.',
        'Our wins mostly ran on very ordinary stacks. Seven of the ten had a React front end. The interesting part was always somewhere else.',
        {
          facts: [
            { term: 'The interface', detail: 'React or Next.js with TypeScript, plus Tailwind or plain CSS. Fast to build, and every AI tool knows it well.' },
            { term: 'The API', detail: 'Whatever the back-end person writes fastest. On our wins: FastAPI in Python, Node with Express, Hono on Cloudflare Workers.' },
            { term: 'The data', detail: 'A hosted Postgres like Supabase, or SQLite. Accounts and storage come for free, so nobody builds them.' },
            { term: 'The hosting', detail: 'Anything that deploys from a push in a minute. Set it up before you write the first feature.' },
          ],
        },
        {
          example: {
            win: ECOAPI,
            text: 'A REST API on Cloudflare Workers with Hono and D1, a React dashboard on Cloudflare Pages and a VS Code extension, all in TypeScript. Nothing exotic in the stack, so the weekend went on the part that made it a Best Web API winner: finding costly API calls in real code.',
          },
        },
      ],
    },
    {
      id: 'deploy-early',
      title: 'Deploy before dinner',
      body: [
        'Get the skeleton deployed in the first few hours: one ugly page, one API call, one row in the database, all on the real host. Then deploy every time something works. The judges will see the deployed version, so it should be the one you test.',
        { callout: 'If it only works on your laptop, it doesn’t work yet.' },
        {
          list: [
            'Keep the main branch deployable. Whatever is on it should be safe to show a judge at any moment.',
            'Put every secret in the host’s environment settings from the start, not in the code.',
            'Run database migrations on the deployed database too, every time the schema changes.',
            'Give every slow call a timeout and a fallback, so one API having a bad minute doesn’t freeze the demo.',
          ],
        },
        {
          example: {
            win: FLOWCAST,
            text: 'On demo day, new Google sign-ins landed on the wrong page, because a table from a new feature had never been migrated on the deployed database. The team found it only because they were running the real thing, fixed the schema and replaced the silent failure with a clear error screen.',
          },
        },
      ],
    },
    {
      id: 'fake-it',
      title: 'Fake what isn’t the point',
      body: [
        'Judges spend three minutes on one path through your project. Build that path, make the core of it real, and fake everything around it. A hard-coded account and good seed data are not cheating. They’re how you keep the weekend for the part that matters.',
        { graphic: 'demo-path' },
        'Be honest about it. If a judge asks whether sign-up works, say it’s faked for the demo and show them the part that’s real. They’ll respect that far more than a bluff.',
        {
          figure: winImage(NEMO, '005/606/879/datas/original.png', 'Nemo’s 3D tank scene: a clear tank with a pump, a tube and a catcher, each labelled'),
          caption: 'Nemo’s 3D tank scene. The write-up keeps it apart from the physical tray on the table and says plainly that its equipment and depth are schematic: a rehearsal, not a validated fluid simulation. That makes the real parts easier to trust.',
        },
      ],
    },
    {
      id: 'ai',
      title: 'Let AI write the code you’d write anyway',
      body: [
        [
          'AI is fastest on the code every project needs: the scaffold, the forms, the API routes, the seed data, the CSS. Let it do that, and keep your own attention on the hard part and the demo. It’s only as good as the context you give it, so give it a lot. Why we use it at all is in ',
          { label: 'How to win a hackathon', href: `${guideHref(SLUGS.win)}#ai` },
          '.',
        ],
        { pull: 'It’s only as good as the context you give it.' },
        {
          steps: [
            [{ strong: 'Write the spec first.' }, ' A short note on what the demo path does, screen by screen, and the data shapes between layers. Give it to the AI with every task.'],
            [{ strong: 'Ask for small pieces.' }, ' One endpoint, one screen, one function at a time. A whole app in one prompt comes back plausible and broken.'],
            [{ strong: 'Paste the real error.' }, ' The full message, the file and what you expected. Vague questions get generic answers.'],
            [{ strong: 'Check it runs before you build on it.' }, ' A quick test or a click through the screen. Five minutes now saves an hour at 3 AM.'],
          ],
        },
        {
          example: {
            win: FLOWCAST,
            text: 'The team used Kiro for spec-driven development, going from requirements to a design to tasks, with steering files for their rules on honest data and hooks that ran the tests every time the agent stopped.',
          },
        },
        {
          example: {
            win: NEMO,
            text: 'Used Grok to research the physics and to challenge the implementation, with Cursor for development. The write-up says they checked its suggestions against the code, the data and the tests, and kept a record of the corrections.',
          },
        },
      ],
    },
    {
      id: 'templates',
      title: 'Templates and open source',
      body: [
        'Starting from open-source code can save you a day, as long as the code you start from isn’t the project. Use it for the parts that aren’t judged: a UI kit, an auth library, a game engine. Then say what you used in the write-up.',
        {
          example: {
            win: SUPER_ARTIFICIAL_BROS,
            text: 'Built on existing open-source code for the classic Mario game, with Gemini generating new levels on top. The team’s honest note: starting from someone else’s code needs real understanding before you can debug and change it.',
          },
        },
      ],
    },
    {
      id: 'cut-scope',
      title: 'Cut early, and in order',
      body: [
        'Every team has to cut something. The ones that cut on Saturday afternoon ship a polished demo. The ones that cut at 7 AM on Sunday ship whatever was half done. Decide now what goes first.',
        {
          list: [
            [{ strong: 'First:' }, ' settings, profiles, admin pages and anything a judge won’t click.'],
            [{ strong: 'Then:' }, ' real sign-up and sign-in. A hard-coded account does the job.'],
            [{ strong: 'Then:' }, ' the second user flow. One path, done well, beats two half-built ones.'],
            [{ strong: 'Then:' }, ' the mobile layout, unless the demo is on a phone.'],
            [{ strong: 'Never:' }, ' the demo moment, or the sponsor tech the prize is for.'],
          ],
        },
        {
          figure: winImage(HEAR_ME_OUT, '005/692/848/datas/original.png', 'A notebook page: three boxes marked V1, V2 and V3, notes on switching tracks, and an architecture diagram below'),
          caption: 'Hear me Out planned in versions, V1 to V3, with the architecture drawn underneath. Each version is something that works on its own.',
          shape: 'tall',
        },
        ['When the build is done, the next job is the demo. Read ', guideLink(SLUGS.demo, 'Demo and pitch tips'), '.'],
      ],
    },
  ],
}
