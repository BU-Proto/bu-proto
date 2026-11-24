// The Business group's playbook: short guides for the company side of building, the Business
// group's answer to the CS group's hackathon playbook (src/content/guides/). Each guide is plain
// sections of paragraphs and lists; the pages are src/pages/BusinessPlaybook.tsx.

import type { Link } from './types'

/** A paragraph, or a short list. */
export type GuideBlock = { p: string } | { list: readonly string[] }

export interface GuideSection {
  heading: string
  blocks: readonly GuideBlock[]
}

export interface BusinessGuide {
  slug: string
  title: string
  /** One line, for the playbook's list and under the guide's title. */
  summary: string
  /** Reading time in minutes, from the word count at about 230 words a minute. */
  minutes: number
  sections: readonly GuideSection[]
  /** Where to take it at Proto: a line, then the places it points to. */
  atProto: { text: string; links: readonly Link[] }
}

export const BUSINESS_PLAYBOOK = {
  /** The browser tab's title. */
  tab: 'The Business playbook',
  label: 'Business group',
  title: 'The Business playbook',
  lede: 'Short guides for the company side of building: pitching, finding customers, finding a co-founder and raising money. Written for people starting out, from any field.',
  byline: 'The Proto Business group',
  minutes: (minutes: number) => `${minutes} min read`,
  guideOf: (index: number, total: number) => `Guide ${String(index + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')}`,
  back: 'The Business playbook',
  atProto: 'At Proto',
  previous: 'Previous',
  next: 'Next',
  notFound: {
    title: "That guide isn't here",
    text: 'It may have moved. Every guide is in the playbook.',
    link: 'Back to the Business playbook',
  },
} as const

export const BUSINESS_PLAYBOOK_HREF = '/business/playbook'
export const businessGuidePath = (guide: Pick<BusinessGuide, 'slug'>) => `${BUSINESS_PLAYBOOK_HREF}/${guide.slug}`

export const BUSINESS_GUIDES: readonly BusinessGuide[] = [
  {
    slug: 'pitch',
    title: 'Pitch it in five minutes',
    summary: 'What a short pitch covers, how to practise it, and how to handle the questions after.',
    minutes: 3,
    sections: [
      {
        heading: 'What five minutes has room for',
        blocks: [
          {
            p: 'Five minutes is room for one argument. Judges and investors hear many pitches in a row, and the ones they remember are the ones they could repeat to someone else afterwards. Build yours around these questions, in this order:',
          },
          {
            list: [
              'The problem: what goes wrong, for whom, and how often.',
              'Who has it: a specific kind of person you could name, and roughly how many people like them there are.',
              "What you built: what it does for that person, shown if you can, said in a sentence or two if you can't.",
              'Why now: what changed that makes this possible, or needed, today.',
              "What you're asking for: money, a pilot, advice, a co-founder. Say the actual thing.",
            ],
          },
          {
            p: "Anything that doesn't help answer one of those can go. Market charts, everyone's résumé and a roadmap three years out tend to take time from the parts people will remember.",
          },
        ],
      },
      {
        heading: 'Start with the problem',
        blocks: [
          {
            p: "Open with the person who has the problem and what their day looks like when it goes wrong. A specific story works better than a number you can't back up. If someone you interviewed said it well, quote them word for word.",
          },
          {
            p: "Then show what you built. A short live demo or a screen recording beats a slide that describes the product. If it's early, show the sketch, the prototype or the spreadsheet you're running it on by hand. Judges at early competitions expect early work.",
          },
        ],
      },
      {
        heading: 'Practise out loud',
        blocks: [
          {
            p: 'A pitch that reads well on paper often runs long and sounds stiff when spoken. Say it out loud, with a timer, from the first run.',
          },
          {
            list: [
              'Time it, and cut until it fits in four and a half minutes, so a nervous day still lands under five.',
              'Pitch it to someone who knows nothing about your field, then ask them to tell it back to you. Where their version goes wrong is where yours is hard to follow.',
              'Record yourself once. Watch for the sentence you rush and the slide you read aloud.',
              "Learn the first and last thirty seconds by heart. The middle can flex; the opening and the ask shouldn't.",
            ],
          },
        ],
      },
      {
        heading: 'What judges and investors listen for',
        blocks: [
          {
            p: 'Judges at early competitions are usually founders, investors or people who run startup programs. They know an early idea will change. They listen for two things: whether you know the problem better than they do, and whether this team can build what it says it will.',
          },
          {
            p: 'Evidence beats adjectives. A line like "most of the bakery owners we spoke to still do this by hand every Sunday" says more than "a huge market". So does a short list of people who have tried it and what they said.',
          },
        ],
      },
      {
        heading: 'Handling questions',
        blocks: [
          {
            list: [
              "Answer the question you were asked, in a sentence, then stop. They'll ask a follow-up if they want more.",
              "If you don't know, say so and say how you'd find out. A guess is easy to spot.",
              'Write down every question you get. The same ones come back, and next time the answers belong in the pitch.',
              "A hard question usually means they're interested. Treat it as the start of a conversation.",
            ],
          },
        ],
      },
    ],
    atProto: {
      text: 'Practise at a Business group pitch night, in front of people who build, then take it to a competition.',
      links: [
        { label: 'Pitch nights', href: '/business' },
        { label: 'Pitch competitions', href: '/pitch-competitions' },
      ],
    },
  },
  {
    slug: 'first-customers',
    title: 'Find your first customers',
    summary: 'Talk to people before you build much, ask about what they actually do, and turn the best conversations into first users.',
    minutes: 3,
    sections: [
      {
        heading: 'Talk before you build',
        blocks: [
          {
            p: 'Many early products fail because too few people wanted them badly enough. A week of conversations can tell you that before months of building do.',
          },
          {
            p: 'Aim for fifteen or twenty conversations with people who deal with the problem now. Friends will be kind, and people you hope to sell to someday can only guess, so look past both.',
          },
        ],
      },
      {
        heading: 'Finding people to ask',
        blocks: [
          {
            list: [
              'Start with who you can reach in a day: classmates, coworkers, people in an online group where the problem comes up.',
              'Go where they already are: a shop, a lab, a forum, a professional meetup.',
              'End every conversation by asking who else you should talk to. One good conversation often leads to two more.',
              'Keep the ask small: fifteen minutes, about their work, with no pitch.',
            ],
          },
        ],
      },
      {
        heading: 'How to open',
        blocks: [
          {
            p: "Keep the first message short and about them. Say who you are, that you're trying to understand how people handle the problem, and that you aren't selling anything yet. Something like:",
          },
          {
            list: [
              '"I\'m a student working on how small bakeries handle their weekly orders. Could I ask you about how you do it now? Fifteen minutes, by phone or in person, whenever suits you."',
            ],
          },
          {
            p: "When you meet, spend the first minute on why you're there and the rest listening. Write down what they say in their own words. If they show you how they do it now, a spreadsheet, a whiteboard, a stack of paper, ask to see it.",
          },
        ],
      },
      {
        heading: 'What to ask',
        blocks: [
          {
            p: 'Ask about the last time it happened. People describe the past honestly and the future hopefully, so "would you use this?" tells you very little. Questions that work:',
          },
          {
            list: [
              '"Tell me about the last time this happened."',
              '"What did you do about it?"',
              '"What did that cost you, in time or money?"',
              '"What have you tried that didn\'t work?"',
              '"Who else deals with this?"',
            ],
          },
          {
            p: 'Leave your idea out until the end, if you bring it up at all. Once you describe it, people start being polite.',
          },
        ],
      },
      {
        heading: 'What to listen for',
        blocks: [
          {
            list: [
              "They've already tried to fix it, with a workaround, a spreadsheet or a paid tool they don't like.",
              'They talk about it with some heat. A problem people shrug at rarely turns into something they pay to fix.',
              "It happens often, or it's expensive when it does.",
              "The same complaint comes from people who don't know each other.",
            ],
          },
          {
            p: 'A compliment is not a signal. "That\'s a great idea" usually means the conversation is ending.',
          },
        ],
      },
      {
        heading: 'From conversations to first users',
        blocks: [
          {
            p: 'When you hear the same problem again and again, ask for something real: an hour to try a rough version, a pre-order, a signed note saying they would run a pilot, a small payment. Each one costs them something, and that is what makes it count.',
          },
          {
            p: "Do the first ones by hand if you can. Running the service yourself for five customers teaches you what to build, and it's fine that it doesn't scale yet.",
          },
          {
            p: 'Keep notes from every conversation in one place and read them back each week. Patterns show up in the notes before they show up in your head.',
          },
        ],
      },
    ],
    atProto: {
      text: 'Bring your notes to build night and talk them through with someone a step ahead of you.',
      links: [{ label: 'Build night', href: '/events' }],
    },
  },
  {
    slug: 'co-founder',
    title: 'Find a technical co-founder',
    summary: 'Where builders meet, how to try working together first, and how to split roles and equity honestly. It works the other way round too.',
    minutes: 3,
    sections: [
      {
        heading: 'Start where builders already are',
        blocks: [
          {
            p: 'Good co-founder matches tend to come from working next to someone and seeing how they work. A cold message to a stranger is a hard place to start. Better places:',
          },
          {
            list: [
              'Build night, where people bring what they are working on every week.',
              'CS group nights and hackathons, where engineers go to build something fast.',
              'Classes and labs in the field you need: a robotics lab, a design studio, an engineering capstone.',
              'Firesides and demo night, where you can see who asks good questions and who shows real work.',
            ],
          },
          {
            p: 'Come with something to show: notes from customer conversations, a sketch, a landing page, a spreadsheet. Engineers hear ideas all the time. Work you have already done is what makes them listen.',
          },
          {
            p: "If you're the engineer looking for a business partner, the same holds the other way. Show what you've built, and look for the person who has already talked to customers.",
          },
        ],
      },
      {
        heading: 'Work together on something small first',
        blocks: [
          {
            p: 'Before you decide to start a company together, build something small together: a weekend hackathon, a two-week prototype, a week of customer interviews. It shows you more about working together than months of talking. Watch for:',
          },
          {
            list: [
              'How you make decisions when you disagree.',
              'Whether each of you does what you said, by when you said.',
              'How each of you reacts when something breaks the night before a deadline.',
            ],
          },
        ],
      },
      {
        heading: 'Split roles and equity honestly',
        blocks: [
          {
            p: "Talk about roles early and write them down: who builds, who sells, and who decides when you can't agree. It's an awkward conversation now, and a much worse one once the company is worth something.",
          },
          {
            p: "Equity is the share of the company each founder owns. Early on, most of the work is still ahead, which is why many teams split it evenly or close to it. Whatever you choose, use vesting: each founder earns their shares over time, commonly four years, so someone who leaves early doesn't leave with a large share.",
          },
          {
            p: 'Get a lawyer for the paperwork when you form the company.',
          },
        ],
      },
      {
        heading: 'What to agree on before you start',
        blocks: [
          {
            p: 'A lot of co-founder fights start with expectations nobody said out loud. Talk these through and write the answers down:',
          },
          {
            list: [
              'How much time each of you can give, this semester and after you graduate.',
              "Whether either of you could put in money, and what happens if one can and the other can't.",
              'What happens if one of you wants to stop. Vesting covers the shares; agree on the rest.',
              'That what each of you builds for the company belongs to the company, in writing, when you form it.',
            ],
          },
        ],
      },
      {
        heading: 'Red flags',
        blocks: [
          {
            list: [
              'They want a large share, or a title, before doing any work.',
              "They can't name anyone they've talked to about the problem, or anything they've built.",
              'They disappear for weeks, then come back with a new idea.',
              "You wouldn't trust them with money, or with your name.",
            ],
          },
          {
            p: 'Trust what you saw while working together more than what a résumé says.',
          },
        ],
      },
    ],
    atProto: {
      text: "Build night and CS nights are where Proto's engineers and business people meet.",
      links: [
        { label: 'Events', href: '/events' },
        { label: 'The CS group', href: '/cs' },
      ],
    },
  },
  {
    slug: 'fundraising',
    title: 'How early fundraising works',
    summary: 'Where early money comes from, what a SAFE is, how valuation caps and dilution work, and when not to raise.',
    minutes: 3,
    sections: [
      {
        heading: 'Before you raise',
        blocks: [
          {
            p: "Money buys time to build. It doesn't tell you whether people want what you're making, and it comes with expectations. Get as far as you can on what you have first: customer conversations, a prototype, a few first users. Every step you take before raising lets you sell less of the company for the same money later.",
          },
        ],
      },
      {
        heading: 'Where early money comes from',
        blocks: [
          {
            list: [
              'Friends and family: small amounts from people who know you. Treat it as real money with real paperwork, and only take what they could afford to lose.',
              "Grants and competitions: money that doesn't buy part of your company. University programs, pitch competitions and some government programs give it. It's slow and usually small, and it's all yours.",
              'Angels: people who invest their own money, often former founders. They tend to write smaller checks than funds and decide faster.',
              'Accelerators: programs that invest a small amount for a share of the company and give you a few months of help and a demo day.',
              'Pre-seed and seed funds: firms that invest in very early companies in exchange for a share of the company.',
            ],
          },
        ],
      },
      {
        heading: 'What a SAFE is',
        blocks: [
          {
            p: 'Many early rounds use a SAFE, short for simple agreement for future equity. Y Combinator introduced it in 2013 as a simpler way to invest in very early companies.',
          },
          {
            p: 'With a SAFE, an investor gives you money now and gets shares later, when the company raises a priced round: one where investors and the company agree on a price per share. Until then the investor holds no shares. Two terms decide how many shares they get when it converts:',
          },
          {
            list: [
              'The valuation cap: the most the company can be valued at for their money. If the priced round values the company above the cap, the SAFE converts as if it were at the cap, so they get more shares for having taken the early risk.',
              'The discount: some SAFEs give a percentage off the price that new investors pay in the priced round, instead of a cap or as well as one.',
            ],
          },
        ],
      },
      {
        heading: 'Dilution, in plain numbers',
        blocks: [
          {
            p: "Every time you sell part of the company, each existing owner's share gets smaller. That's dilution. Say two founders own half each, and an investor buys 10 percent of the company. Afterwards the founders own 45 percent each and the investor owns 10.",
          },
          {
            p: "Each round dilutes again, so founders who raise several rounds can end up with a small share of a company worth far more. That trade can be worth making. Make it on purpose, with the numbers in front of you.",
          },
          {
            p: "Y Combinator's standard SAFE today is the post-money kind, which makes this easier to read: the investor's share is roughly their money divided by the cap. $100,000 on a $5 million post-money cap comes to about 2 percent of the company when it converts, before the priced round dilutes everyone.",
          },
        ],
      },
      {
        heading: 'When not to raise',
        blocks: [
          {
            list: [
              "You haven't talked to customers yet. Money can't answer that question for you.",
              'You can reach your next milestone on what you have.',
              'The terms would leave the founders owning too little of the company to keep going.',
              "Everyone around you is raising, and you can't yet say what the money is for.",
            ],
          },
        ],
      },
      {
        heading: 'The paperwork',
        blocks: [
          {
            p: "Use standard documents, such as Y Combinator's published SAFE. Get a lawyer for the paperwork. From the first dollar, keep a simple record of who owns what, called a cap table.",
          },
        ],
      },
    ],
    atProto: {
      text: 'Hear how founders and investors think about money at a fireside, or try your pitch at a competition.',
      links: [
        { label: 'Firesides', href: '/events#firesides' },
        { label: 'Pitch competitions', href: '/pitch-competitions' },
      ],
    },
  },
]
