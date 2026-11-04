// The submission: the write-up, the video, the screenshots and the prizes to enter. Examples
// come from our wins' own Devpost write-ups, which are what the wins pages are imported from.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { ECOAPI, FLOWCAST, HEAR_ME_OUT, NEMO, SAPLING, winImage, winLink } from './wins'

export const WRITE_UP: GuideDoc = {
  slug: SLUGS.writeUp,
  standfirst:
    'The submission is the part of the project that outlives the weekend. Sponsor judges read it, some prizes are decided from it, and long after the demo it’s the page people find. Every win on our site is imported from its Devpost write-up. Here’s how we write ours.',
  sections: [
    {
      id: 'who-reads-it',
      title: 'Who reads it',
      body: [
        'Write for three readers. Each one gives the page a minute at most, and each one wants something different from it.',
        {
          facts: [
            { term: 'The judge before', detail: 'Skims the list to decide which tables to visit first, or which projects make a shortlist. Reads the title, the tagline and the cover image.' },
            { term: 'The sponsor judge', detail: 'Looks for their product. Reads “How we built it” for exactly how you used it, and whether it’s central or bolted on.' },
            { term: 'The reader after', detail: 'A recruiter, a classmate, a future teammate. Reads the whole thing, and wants to know what you built and what you did.' },
          ],
        },
      ],
    },
    {
      id: 'draft-early',
      title: 'Start it at halfway, not at the deadline',
      body: [
        'A submission written in the last twenty minutes reads like it. Start the page on Saturday, when the project is half built and you still remember why you made each choice.',
        {
          steps: [
            [{ strong: 'At halfway:' }, ' create the project, add every teammate, write the tagline and pick the prizes. Some events close team changes before the deadline.'],
            [{ strong: 'At feature freeze:' }, ' take the screenshots and record the video, while everything still works.'],
            [{ strong: 'An hour before the deadline:' }, ' submit. A submitted draft can usually still be edited. A late one usually can’t be judged.'],
            [{ strong: 'In the last hour:' }, ' edit. Read it out loud once, and fix anything that sounds like a template.'],
          ],
        },
        { callout: 'Submit early, then edit. The deadline is for the last fix, not the first draft.' },
      ],
    },
    {
      id: 'sections',
      title: 'Section by section',
      body: [
        'Devpost asks for the same handful of sections every time. Here’s what goes in each, in the order the reader meets them.',
        {
          list: [
            [{ strong: 'Tagline.' }, ' Your one sentence. It shows up everywhere the project is listed, so it has to work on its own.'],
            [{ strong: 'Inspiration.' }, ' The real moment the idea came from. A person, a place, a number. Two or three sentences.'],
            [{ strong: 'What it does.' }, ' Walk through the demo path as a user would: first this, then this. Short steps beat a paragraph.'],
            [{ strong: 'How we built it.' }, ' One line per layer, naming every tool and what it does in the project.'],
            [{ strong: 'Challenges.' }, ' The real ones, specifically. “A table had never been migrated” is more convincing than “time constraints”.'],
            [{ strong: 'Accomplishments and what we learned.' }, ' What works, with numbers where you have them, and one honest lesson.'],
            [{ strong: 'What’s next.' }, ' Two or three concrete steps. It tells judges you know where the prototype ends.'],
          ],
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'Their “What it does” walks through a whole round of the game step by step, from the hot take to the vote and the plan, so a reader who never played it knows exactly how it goes.',
          },
        },
      ],
    },
    {
      id: 'how-we-built-it',
      title: 'Make “How we built it” specific',
      body: [
        'This is the section technical and sponsor judges read most closely. Give each layer a line: what it is, what it does in your project and why you chose it. Name the sponsor’s product and say exactly what it does for you.',
        {
          list: [
            'Bad: “We used React, Python and AI.”',
            ['Good, shortened from ', winLink(SAPLING, 'Sapling’s write-up'), ': “A FastAPI backend and a Next.js frontend. A Supabase Postgres database holds profiles, graphs and assignments. The Gemini API provides tutoring responses and quiz generation.”'],
          ],
        },
        { pull: 'Name the sponsor’s product and say exactly what it does for you.' },
        {
          example: {
            win: ECOAPI,
            text: 'The write-up splits the build into its three parts, the API, the dashboard and the VS Code extension, and gives each its own list of what it’s built on. A Best Web API judge can see at a glance where the API is and how it works.',
          },
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'Each sponsor gets its own line saying what it does in the game: SpacetimeDB runs the rooms, timers and votes, Apify finds live places and menus, and the whole design process lives in their Notability notebook.',
          },
        },
      ],
    },
    {
      id: 'video',
      title: 'The video',
      body: [
        'Many events require a demo video, and every judge who didn’t see you live will watch it instead. Treat it as the demo, recorded.',
        {
          checklist: [
            'Check the length limit and stay under it. Two minutes is plenty, and shorter is fine.',
            'Open on the problem and the one sentence, then go straight to the product. No title card for ten seconds.',
            'Show the demo path working, on the deployed version, with a voice over saying what the viewer is seeing.',
            'Record it at feature freeze, while it works. Re-recording at 8 AM on Sunday is how videos get skipped.',
            'Upload it somewhere public, open the link in a private window, and make sure it plays.',
          ],
          title: 'Do this',
        },
      ],
    },
    {
      id: 'pictures',
      title: 'Screenshots that explain themselves',
      body: [
        'The cover image is the project’s thumbnail on every list, so make it the demo moment, not the logo. Then add three to six more that a reader could follow without the text.',
        {
          figure: winImage(FLOWCAST, '005/691/983/datas/original.png', 'Flowcast’s landing page over a map of Boston, headed “See how busy campus is before you go.”'),
          caption: 'Flowcast’s landing page says what the project does in one line, over the thing itself. A screenshot like this works as a cover, a slide and a tagline at once.',
        },
        {
          list: [
            'Use real-looking data in every shot, and crop out the browser and the desktop.',
            'Include one diagram of how it works. A box for each layer and arrows between them is enough.',
            'If it’s hardware, include a photo of the real thing on the table.',
            'If the prize is about process, show the process: sketches, rejected ideas, design revisions.',
          ],
        },
        {
          figure: winImage(HEAR_ME_OUT, '005/692/844/datas/original.png', 'A handwritten notebook page describing how the team went from picking a track to their final idea'),
          caption: 'A page from Hear me Out’s notebook, part of their submission: how they picked a track, studied past winners and crossed out seven ideas.',
          shape: 'tall',
        },
      ],
    },
    {
      id: 'prizes',
      title: 'Enter every prize you honestly fit',
      body: [
        'When you submit, you choose which prizes to be judged for. Most events let one project enter several, and some sponsor prizes are only judged for teams that opted in. Missing the checkbox is the easiest way to lose a prize you would have won.',
        {
          checklist: [
            'Go through the prize list again before you submit. Tick every one the project genuinely fits.',
            'Read each sponsor prize’s extra requirements: a specific API, a separate form, a line in the write-up, a visit to their table.',
            'For each sponsor prize, say in the write-up exactly how you used their product.',
            'Don’t tick prizes you don’t fit. Sponsor judges read every entry, and a stretch claim costs you credibility on the ones you do fit.',
          ],
          title: 'At submission',
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The team’s notebook records the switch: they first aimed at Meta, Anthropic and Cartesia, then talked with judges and switched to Meta, SpacetimeDB, Apify and Notability. They won Best Use of Notability.',
          },
        },
      ],
    },
    {
      id: 'honest',
      title: 'Be honest about what works',
      body: [
        'Judges have read hundreds of write-ups that promise more than the demo showed. Say what’s real, what’s simulated and what you used from before the weekend. It makes everything else on the page easier to believe.',
        {
          example: {
            win: FLOWCAST,
            text: 'Labels every number as either published evidence or a named model assumption, and says where the simulation and the real counts disagree.',
          },
        },
        {
          example: {
            win: NEMO,
            text: 'Calls itself a working research prototype, not a finished pollution finder, and lets the model answer “Unknown”.',
          },
        },
        ['A full example to model yours on is the ', winLink(HEAR_ME_OUT, 'Hear me Out write-up'), '. What the judges do with it is in ', guideLink(SLUGS.judging, 'How judging works'), '.'],
      ],
    },
  ],
}
