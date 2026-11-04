// Every win, taken apart: the angle, the track it aimed at, what made the demo work.
// Each point comes from the team's own write-up on the win's page. Keep it that way.

import { guideLink, SLUGS } from './links'
import type { Block, GuideDoc, GuideSection, WinRef } from './types'
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
  winLink,
} from './wins'

interface Breakdown {
  win: WinRef
  /** The anchor for the contents list. */
  id: string
  angle: string
  track: string
  demo: string
  lesson: string
}

function section({ win, id, angle, track, demo, lesson }: Breakdown): GuideSection {
  const body: Block[] = [
    [{ strong: win.prize }, `, ${win.event}.`],
    {
      facts: [
        { term: 'The angle', detail: angle },
        { term: 'The track', detail: track },
        { term: 'The demo', detail: demo },
        { term: 'Take this', detail: lesson },
      ],
    },
    [winLink(win, `Read the ${win.project} write-up`)],
  ]
  return { id, title: win.project, body }
}

const BREAKDOWNS: readonly Breakdown[] = [
  {
    win: NEMO,
    id: 'nemo',
    angle: 'Hardware and social good. A physical tank experiment for a real environmental question: where did floating trash enter the water, and where could you catch the next piece?',
    track: 'Overall placement plus the ASUS Sustainability track. Ocean pollution fit the sustainability brief without any stretching.',
    demo: 'Something real on the table: a webcam over a clear tray with a pump, a mesh collector and a green bottle cap tracked by OpenCV. Alongside it, archived NOAA buoy data and physics that rank the likely entry points, plus an investigator you can question over iMessage.',
    lesson: 'Be honest about what your prototype proves. The write-up calls Nemo a working research prototype, not a finished pollution finder, and lets the model answer “Unknown”. That makes the rest more believable.',
  },
  {
    win: ECOAPI,
    id: 'ecoapi',
    angle: 'A developer tool with a sustainability frame: what your vibe-coded app’s API calls cost in money, and in electricity, water and CO₂.',
    track: 'Best Web API. The core of the project is a REST API on Cloudflare Workers, with a dashboard and a VS Code extension built on top.',
    demo: 'It runs on real code. The team used it on the open-source project OpenClaw, found a vulnerability and submitted a pull request with the fix.',
    lesson: 'Start from a real moment. The idea came from someone at a hackathon getting their API key revoked for 200 concurrent requests.',
  },
  {
    win: NOOGIE,
    id: 'noogie',
    angle: 'Design-first. News from several sources, summarised with AI, so you see more than one side of a story.',
    track: 'Best Design.',
    demo: 'Stories shown as clusters of connected nodes drawn with d3.js. The main idea is something you can look at and explore.',
    lesson: 'If you’re going for a design prize, choose an idea that’s naturally visual, then spend the hours on how it looks and feels.',
  },
  {
    win: EYRIE,
    id: 'eyrie',
    angle: 'Social good with high stakes: preventing crowd crushes like the 2022 Itaewon disaster, where over 150 people died.',
    track: 'Best AI Application Built with Cloudflare, a sponsor prize that, as the name says, wants AI and Cloudflare together.',
    demo: 'Live video over WebRTC, a YOLOv8 model detecting heads to measure how packed the crowd is, and alerts for event staff when it gets dangerous.',
    lesson: 'A real event gives judges a reason to care before you show anything. Name it.',
  },
  {
    win: HEAR_ME_OUT,
    id: 'hear-me-out',
    angle: 'AI with a twist. A party game where an AI host finds real places nearby, each player argues for one, and the AI fact-checks the pitches against real listings.',
    track: 'Best Use of Notability. The team kept their whole process in a Notability notebook, from the track requirements to rejected ideas and design revisions, and shared it with the submission.',
    demo: 'Everyone plays on their own phone with a room code, so a whole table can play at once. The team ran the deployed game end to end with three players before judging.',
    lesson: 'Show your process when the prize is about it. Their notebook shows seven ideas questioned, a hardware idea dropped and the design narrowed step by step.',
  },
  {
    win: SAPLING,
    id: 'sapling',
    angle: 'Education, with AI that teaches rather than answers. A tutor with Socratic, explaining and Teachback modes, where you teach it.',
    track: 'The AI Tutor prize at Civic Hacks.',
    demo: 'A live knowledge graph that grows as you study, with mastery scores on each concept, adaptive quizzes and calendar sync from your syllabus.',
    lesson: 'Give the AI structure. The team found that capturing concepts in a graph made the tutor’s help far more coherent than chat history alone.',
  },
  {
    win: SPLIT_WORLD,
    id: 'split-world',
    angle: 'Sponsor tech, all in. Charades as an AR game built entirely inside Snapchat.',
    track: 'Best use of Snap Lens Studio.',
    demo: 'One player acts out a word as a body-tracked stick figure, sends the clip, and the other guesses. You understand it the moment you see it.',
    lesson: 'Use AI to learn a new platform fast, then slow down when it hits a wall. The team built with Claude Code and leaned on the docs when Lens Studio pushed back.',
  },
  {
    win: FLOWCAST,
    id: 'flowcast',
    angle: 'Social good on home ground: a live 3D model of BU that forecasts where it’s busy and where it’s quiet, built from public data.',
    track: 'Best First-Time Hacker at DS+X.',
    demo: 'A 3D campus where simulated students follow real class schedules and every building glows by how full it is, plus live transit, events and an AI guide you can ask “Least crowded library right now?”',
    lesson: 'Honesty is a feature. The team labels every number as published evidence or a model assumption, and shows where the model is wrong.',
  },
  {
    win: STALK_MARKET,
    id: 'stalk-market',
    angle: 'Education through a game: learning to invest with stocks as plants that grow and wilt.',
    track: 'Best Technical Execution at DS+X.',
    demo: 'A practice market simulated with Geometric Brownian Motion, with a machine learning model that reacts to what the player does.',
    lesson: 'A friendly surface can carry serious technical work. The farming game is the hook. Underneath, by the team’s account, the hard part was running two AI models at the same time.',
  },
  {
    win: SUPER_ARTIFICIAL_BROS,
    id: 'super-artificial-bros',
    angle: 'AI with a twist, on something everyone knows: Gemini generating endless new Super Mario Bros. levels and stories.',
    track: 'The MakerMods sub-track at BostonHacks.',
    demo: 'Generated levels that are actually playable and don’t softlock, with cutscenes where your choices shape the next level.',
    lesson: 'Remixing open-source code is a fast start, but you have to understand it to change it. And AI help is only as good as the context you give it.',
  },
]

export const BREAKDOWN_GUIDE: GuideDoc = {
  slug: SLUGS.breakdowns,
  sections: [
    {
      id: 'how-to-read',
      title: 'How to read these',
      body: [
        'These are real prizes our team has won. For each one: the angle that made it stand out, the track or prize it went for, what made the demo land, and one thing to take into your next weekend.',
        ['The method behind them is in ', guideLink(SLUGS.win, 'How to win a hackathon'), ', and the angles are explained in ', guideLink(SLUGS.ideas, 'Finding an idea and an angle'), '.'],
      ],
    },
    ...BREAKDOWNS.map(section),
  ],
}
