// Finding an idea: start from the tracks, then pick an angle that gives you a step up.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
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

export const IDEAS: GuideDoc = {
  slug: SLUGS.ideas,
  sections: [
    {
      id: 'start-from-tracks',
      title: 'Start from the tracks, not a blank page',
      body: [
        '“What should we build?” is a hard question. “What would win this prize?” is an easier one, and the hackathon has already written the list of prizes for you. Start there.',
        {
          steps: [
            'Open the event’s prize page and write down every track and sponsor prize, including the small ones.',
            'Next to each, write what it asks for in its own words: “best use of our API”, “most impactful for the community”, “best design”.',
            'Note which ones overlap. A sustainability track and a sponsor’s cloud prize can often be won by the same project.',
            'Cross off the ones you can’t do this weekend: the hardware you don’t have, the API you can’t get a key for.',
          ],
        },
        'What’s left is your search space. Every idea you brainstorm should aim at one prize on that list and ideally touch a second.',
      ],
    },
    {
      id: 'what-an-angle-is',
      title: 'What an angle is',
      body: [
        'An angle is the reason a judge remembers your project after seeing forty others. It’s the frame around the idea: something physical on the table, a real problem with real stakes, a tool the judges would use themselves, a sponsor’s product used better than anyone else used it.',
        'The same idea can be forgettable or a winner depending on the angle. “Track your API usage” is a dashboard. “Your vibe-coded app is ruining your keys and the environment” is a developer tool with a sustainability frame, and it won first place in its track.',
        { callout: 'A good angle usually comes from a track. Read the prize, then ask which angle a team would need to stand out in it.' },
        'Here are the angles we’ve seen work, with the projects that used them.',
      ],
    },
    {
      id: 'hardware',
      title: 'Hardware',
      body: [
        'Judges remember things they can touch. A device on the table, a camera pointed at something real or a sensor reacting live does half the pitch for you, and far fewer teams attempt it, so the field is smaller.',
        {
          list: [
            'Keep the hardware simple and the software smart. A webcam and a clever pipeline beats a custom board that doesn’t boot.',
            'Check what the venue lends out before you plan around a part, and bring spares of anything cheap.',
            'Be clear about what the hardware proves and what it doesn’t. Judges respect honesty more than a big claim.',
          ],
        },
        {
          example: {
            win: NEMO,
            text: 'A webcam over a clear tray, a small pump, a mesh collector and a green bottle cap standing in for floating trash. OpenCV tracks the cap, and the software compares where it could have entered the water using ocean-current physics. The write-up is careful to say what the tank proves and what it doesn’t.',
          },
        },
      ],
    },
    {
      id: 'social-good',
      title: 'Social good and civic impact',
      body: [
        'A problem with real stakes gives the judges a reason to care before the demo starts. Name a real event, a real place or a real group of people. Specific beats general.',
        {
          list: [
            'Open with the problem, not the tech. One real story or one real number.',
            'Say who uses it and what they do differently because of it.',
            'Don’t overclaim. “A working prototype” is more believable than “this will save thousands of lives”.',
          ],
        },
        {
          example: {
            win: EYRIE,
            text: 'Starts from the 2022 Itaewon crowd crush in Seoul, where over 150 people died, and builds a system that warns event staff before a crowd gets dangerously packed.',
          },
        },
        {
          example: {
            win: FLOWCAST,
            text: 'A live 3D model of BU that forecasts where it’s crowded, framed around students with anxiety, sensory sensitivities or mobility needs, for whom knowing where it’s quiet decides whether they go at all.',
          },
        },
      ],
    },
    {
      id: 'dev-tools',
      title: 'Dev tools and APIs',
      body: [
        'Developer tools are judged by other builders, and builders feel the pain you’re solving. If the judge has hit the problem themselves, you don’t need to convince them it’s real.',
        {
          list: [
            'Show it working on real code, ideally code the judge recognises.',
            'Dev tools are hard to demo because they’re invisible. Give it a visual: a dashboard, a graph, an editor panel.',
            'Ship it the way developers use things: an API, a CLI, an extension. Not just a website about it.',
          ],
        },
        {
          example: {
            win: ECOAPI,
            text: 'A REST API on Cloudflare Workers, a dashboard with a dependency graph and a VS Code extension that scans your code for costly API calls. The team used it on an open-source project, found a vulnerability and submitted a pull request with the fix. It won Best Web API.',
          },
        },
      ],
    },
    {
      id: 'sponsor-tech',
      title: 'Sponsor-tech tracks',
      body: [
        'A “best use of” prize is judged by the people who make the product. They want to see it used well: as the core of the project, in a way they hadn’t thought of, and working. Few teams take these seriously, so a focused project has good odds.',
        {
          list: [
            'Read the sponsor’s prize description and their docs before the event.',
            'Talk to their engineers at the booth. Ask what they wish people built.',
            'Build the project so that it couldn’t exist without the sponsor’s product.',
            'Show it on screen and say its name.',
          ],
        },
        {
          example: {
            win: SPLIT_WORLD,
            text: 'Charades as an AR game built entirely inside Snapchat with Lens Studio, using body tracking to turn the actor into a stick figure. Snap’s platform isn’t an add-on, it’s the whole game.',
          },
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The team kept their whole process in Notability: track research, seven rejected ideas, sketches and design revisions, shared as part of the submission.',
          },
        },
      ],
    },
    {
      id: 'ai-twist',
      title: 'AI with a twist',
      body: [
        'Half the room will build a chatbot. A chat box over a model is the most common project at any hackathon, so it’s also the hardest to win with. Use AI for something the judges haven’t seen it do: a role, a structure, a game.',
        {
          list: [
            'Give the AI a job other than answering questions: host, judge, level designer, tutor that asks back.',
            'Pair the model with something structured, like a graph, a simulation or real data, so it isn’t just generating text.',
            'Show what the AI produces, not the prompt.',
          ],
        },
        {
          example: {
            win: SAPLING,
            text: 'An AI tutor that builds a live knowledge graph of what you know as you learn, with a Teachback mode where you teach the AI instead of the other way round.',
          },
        },
        {
          example: {
            win: SUPER_ARTIFICIAL_BROS,
            text: 'Gemini generates new, playable Super Mario Bros. levels, and choices in cutscenes shape what the next level brings.',
          },
        },
      ],
    },
    {
      id: 'design-first',
      title: 'Design-first and UX',
      body: [
        'Design prizes reward the project that looks and feels best, which is a different contest from the most technical one. If your team has a strong designer, aim at one, and let the idea be something that’s naturally visual.',
        {
          list: [
            'Pick an idea where the main thing is something you see: a map, a graph, a game.',
            'Spend real hours on the flow, not just the colours. Judges click through it.',
            'Keep your sketches and revisions. Showing how the design changed is part of the story.',
          ],
        },
        {
          example: {
            win: NOOGIE,
            text: 'World news as clusters of connected nodes, so you can see a story from several sides at once. It won Best Design at PennApps.',
          },
        },
      ],
    },
    {
      id: 'education',
      title: 'Education',
      body: [
        'Education tracks are common, and judges have seen a lot of flashcard apps. The angle that works is making learning active: you do something, and the tool responds to it.',
        {
          example: {
            win: SAPLING,
            text: 'Won the AI Tutor prize by being a tutor that tracks mastery and makes you explain things back, rather than a tool that hands out answers.',
          },
        },
        {
          example: {
            win: STALK_MARKET,
            text: 'Teaches investing through a farming game, where stocks grow and wilt as plants in a simulated market. It won Best Technical Execution.',
          },
        },
      ],
    },
    {
      id: 'sustainability',
      title: 'Sustainability',
      body: [
        'Sustainability tracks show up at most big events, often sponsored. You don’t need a climate startup idea. Sustainability can be the frame on another idea: measure the footprint of something people already do.',
        {
          example: {
            win: NEMO,
            text: 'Tracing ocean pollution back to where it entered the water. It won the ASUS Sustainability track and placed third overall.',
          },
        },
        {
          example: {
            win: ECOAPI,
            text: 'A developer tool at heart that also estimates the electricity, water and CO₂ behind your API calls.',
          },
        },
      ],
    },
    {
      id: 'beginner-prizes',
      title: 'Beginner-friendly prizes',
      body: [
        'Many events have a prize for first-time hackers or beginner teams. If anyone on your team qualifies, read the eligibility rules closely, because they decide who can enter, and aim at it. The bar is still high, but the pool is smaller.',
        {
          example: {
            win: FLOWCAST,
            text: 'Won Best First-Time Hacker at DS+X 2026 with a big swing: a live 3D model of BU’s campuses, simulated from public schedules, capacities and transit data.',
          },
        },
      ],
    },
    {
      id: 'exercise',
      title: 'A 30-minute brainstorm against the track list',
      body: [
        'Do this as a team in the first hour, with the track list in front of you.',
        {
          steps: [
            [{ strong: 'Five minutes, alone:' }, ' everyone writes three problems they or someone they know has actually had. Problems, not apps.'],
            [{ strong: 'Ten minutes, together:' }, ' read them out. For each problem, say which tracks it could win. Keep the ones that hit at least one.'],
            [{ strong: 'Five minutes:' }, ' give each survivor an angle from this page. If none fits, drop it.'],
            [{ strong: 'Five minutes:' }, ' for each one left, write the demo moment in one sentence: “The judge sees ___ happen.” If you can’t, drop it.'],
            [{ strong: 'Five minutes:' }, ' run the red flags below. Vote. Commit, and don’t reopen the question after the first two hours.'],
          ],
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'The team wrote down seven directions and why each might not work before picking one. They even pivoted away from a hardware idea and still won.',
          },
        },
      ],
    },
    {
      id: 'red-flags',
      title: 'Red flags',
      body: [
        {
          list: [
            [{ strong: 'It’s just a wrapper.' }, ' A text box, a prompt and a model. Judges have seen it twenty times today.'],
            [{ strong: 'It’s too big to finish.' }, ' If showing anything needs accounts, payments, a social graph and a trained model, cut it down or pick another.'],
            [{ strong: 'There’s no demo moment.' }, ' If nothing visibly happens on screen, it’s hard to judge and easy to forget.'],
            [{ strong: 'The data doesn’t exist.' }, ' If you need a dataset you can’t get by Saturday morning, you’ll spend the weekend faking it.'],
            [{ strong: 'The sponsor tech is decoration.' }, ' If you could delete their API and the demo still works, so could the judges.'],
            [{ strong: 'Nobody on the team has the problem.' }, ' You’ll struggle to explain why it matters.'],
          ],
        },
      ],
    },
    {
      id: 'our-wins',
      title: 'Our wins, by angle',
      body: [
        {
          facts: [
            { term: 'Hardware', detail: [winLink(NEMO), ': a webcam, a tank and ocean physics.'] },
            { term: 'Social good', detail: [winLink(EYRIE), ' and ', winLink(FLOWCAST), ': crowd safety and campus crowding.'] },
            { term: 'Dev tools', detail: [winLink(ECOAPI), ': an API, a dashboard and a VS Code extension.'] },
            { term: 'Sponsor tech', detail: [winLink(SPLIT_WORLD), ' on Snap Lens Studio, ', winLink(HEAR_ME_OUT), ' on Notability, ', winLink(EYRIE), ' with Cloudflare.'] },
            { term: 'AI with a twist', detail: [winLink(SAPLING), ', ', winLink(HEAR_ME_OUT), ' and ', winLink(SUPER_ARTIFICIAL_BROS)] },
            { term: 'Design', detail: [winLink(NOOGIE), ': news as a node graph.'] },
            { term: 'Education', detail: [winLink(SAPLING), ' and ', winLink(STALK_MARKET), '.'] },
            { term: 'Sustainability', detail: [winLink(NEMO), ' and ', winLink(ECOAPI), '.'] },
            { term: 'Beginner prizes', detail: [winLink(FLOWCAST), '.'] },
          ],
        },
        ['Each one is broken down in ', guideLink(SLUGS.breakdowns, 'Winning projects, broken down'), '.'],
      ],
    },
  ],
}
