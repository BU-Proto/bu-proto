// Demo and pitch: the three minutes that decide the weekend.

import { guideLink, SLUGS } from './links'
import type { GuideDoc } from './types'
import { EYRIE, FLOWCAST, HEAR_ME_OUT, NOOGIE, SPLIT_WORLD, winLink } from './wins'

export const DEMO: GuideDoc = {
  slug: SLUGS.demo,
  sections: [
    {
      id: 'demo-moment',
      title: 'Find the demo moment',
      body: [
        'Every winning demo has one moment where the judge leans in: the thing on screen reacts, the device on the table moves, the answer appears. Find yours before you build, and build towards it.',
        {
          list: [
            'It should be visible. A number changing on a dashboard is weaker than a map lighting up.',
            'It should be live, or at least look live. Click, and something happens.',
            'It should come early, inside the first minute, not after the architecture slide.',
          ],
        },
        {
          example: {
            win: SPLIT_WORLD,
            text: 'The moment is obvious: someone acts out a word as a body-tracked stick figure inside Snapchat, and the other player guesses. Anyone watching gets it in seconds.',
          },
        },
      ],
    },
    {
      id: 'one-sentence',
      title: 'The one-sentence pitch',
      body: [
        'Before you plan the three minutes, write the one sentence. If a judge remembers only one line from your table, this is it. A useful shape is “X is a Y that does Z for W”, but the best ones are shorter than that.',
        {
          list: [
            [winLink(EYRIE), ': “Preventing crowd crush before it happens.”'],
            [winLink(SPLIT_WORLD), ': “Act it out. Guess it right. All inside Snapchat.”'],
            [winLink(HEAR_ME_OUT), ': “An AI party game that turns strangers into a plan and dead group chats into hangouts.”'],
          ],
        },
        'Say it at the start of the pitch, put it at the top of your write-up and use it as the tagline on your submission.',
      ],
    },
    {
      id: 'structure',
      title: 'Three minutes, in order',
      body: [
        'Most judging slots are a few minutes long, often with questions after. Here’s a shape that fits in three, and stretches or shrinks as needed.',
        {
          steps: [
            [{ strong: 'The problem (about 20 seconds).' }, ' One real story or one real number. Who has this problem, and why does it hurt?'],
            [{ strong: 'The pitch (about 10 seconds).' }, ' Your one sentence.'],
            [{ strong: 'The demo (about 90 seconds).' }, ' One user, one path, start to finish. Hit the demo moment early. Narrate what the judge is seeing, not what the code is doing.'],
            [{ strong: 'How it works (about 30 seconds).' }, ' The one or two technical things you’re proudest of. Name the sponsor tech if you’re going for its prize.'],
            [{ strong: 'What’s next (about 20 seconds).' }, ' One line on where it goes, then thank them and stop.'],
          ],
        },
        { callout: 'Don’t open with your names and your stack. Open with the problem. Introductions can wait until the questions.' },
      ],
    },
    {
      id: 'practise',
      title: 'Practise it',
      body: [
        {
          checklist: [
            'Freeze features early enough to rehearse. A rehearsed demo of fewer features beats a fresh demo of more.',
            'Run it out loud at least three times, timed, with someone on the team playing a judge.',
            'Practise the questions too: “What was the hardest part?”, “What did you build this weekend?”, “Who would use this?”',
            'Decide who talks and who drives the laptop. Two people works well: one tells the story, one clicks.',
            'Rehearse on the deployed version, on the venue Wi-Fi, with the screen you’ll present on.',
          ],
          title: 'Do this',
        },
        {
          example: {
            win: HEAR_ME_OUT,
            text: 'They played the deployed game end to end with three separate players before judging. For a multiplayer game, that’s the only rehearsal that counts.',
          },
        },
      ],
    },
    {
      id: 'backup',
      title: 'Have a backup',
      body: [
        'Something will break at the worst moment: the Wi-Fi, an API rate limit, a sign-in. Plan for it.',
        {
          list: [
            'Record a screen video of the full demo working while it still works. Keep it on the laptop, not just online.',
            'Have the demo state loaded before the judge arrives: signed in, data seeded, tabs open in order.',
            'Know where the fallbacks are. If a slow API might hang, have cached results ready.',
            'If it breaks live, don’t debug in front of the judge. Say what should have happened, switch to the video and keep going.',
          ],
        },
        {
          example: {
            win: FLOWCAST,
            text: 'Found a sign-in bug on demo day itself, caused by a table that had never been migrated. They fixed it and replaced the silent failure with a clear error screen.',
          },
        },
      ],
    },
    {
      id: 'what-judges-look-at',
      title: 'What judges look at',
      body: [
        'Rubrics differ, but most score some version of the same things. Your demo should give them an easy answer for each.',
        {
          facts: [
            { term: 'Does it work?', detail: 'A live demo of the real thing. The more of it that’s real, the better.' },
            { term: 'Is it hard?', detail: 'One or two technical things you can explain clearly when asked.' },
            { term: 'Is it new?', detail: 'Your angle. Why this isn’t the same project they saw an hour ago.' },
            { term: 'Does it matter?', detail: 'The problem, and who has it.' },
            { term: 'Is it well made?', detail: 'The design and the flow. How it feels to use.' },
          ],
        },
        ['More on formats and criteria is in ', guideLink(SLUGS.judging, 'How judging works'), '.'],
      ],
    },
    {
      id: 'polish',
      title: 'How UI polish reads',
      body: [
        'Judges can’t read your code in three minutes, so they read your interface instead. A consistent, tidy UI says the team was in control. Misaligned buttons, placeholder text and a raw error message say the opposite, even if the backend is brilliant.',
        {
          list: [
            'Polish only the screens in the demo path. Nobody will see the settings page.',
            'Use real-looking data. Real names of places, realistic numbers.',
            'Big text and high contrast for projectors and judges standing a few feet back.',
            'Hide the developer tools, the terminal and your notifications before you start.',
          ],
        },
        {
          example: {
            win: NOOGIE,
            text: 'Won Best Design by making the core idea, news from several sides, into a picture: clusters of connected nodes you can explore.',
          },
        },
      ],
    },
    {
      id: 'write-up',
      title: 'The write-up counts too',
      body: [
        'Sponsor judges often read the submission before or after they see you, and some prizes are judged mostly from it. Treat it like part of the demo.',
        {
          list: [
            'Lead with the one sentence and a screenshot or a short video.',
            'Explain the problem, what it does, how you built it and what was hard, in plain words.',
            'If you’re going for a sponsor prize, say exactly how you used their product.',
            'Submit a draft early and edit it before the deadline. A late submission usually can’t be judged.',
          ],
        },
        ['Our ', winLink(HEAR_ME_OUT, 'Hear me Out write-up'), ' is a good model: it walks through a round of the game step by step, then shows the whole design process.'],
      ],
    },
  ],
}
