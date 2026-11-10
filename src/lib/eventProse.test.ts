// npm test: the write-up parser over the descriptions it was built for (eventProse.fixtures.json,
// the events in the local database when it was written) and the awkward ones it must not mangle.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { mergeHosts, parseEventProse, type EventProse, type ProseBlock } from './eventProse.ts'

interface Fixture {
  id: number
  date: string
  text: string
  description: string
  hosts: { name: string; href: string | null }[]
}

const fixtures: Fixture[] = JSON.parse(readFileSync(new URL('./eventProse.fixtures.json', import.meta.url), 'utf8'))
const fixture = (id: number) => {
  const found = fixtures.find((item) => item.id === id)
  assert.ok(found, `no fixture for event ${id}`)
  return found
}
const parseFixture = (id: number) => {
  const event = fixture(id)
  return parseEventProse(event.description, { lede: event.text, date: event.date })
}

/** A block as a word: "list3" is a list of three, "p" a paragraph. */
const blockShape = (block: ProseBlock) => {
  if (block.kind === 'paragraph') return 'p'
  if (block.kind === 'list') return `list${block.items.length}`
  if (block.kind === 'facts') return `facts${block.rows.length}`
  return `people${block.people.length}`
}
const shape = (prose: EventProse) => prose.sections.map((section) => [section.heading, section.blocks.map(blockShape)])
/** A description typed the way Luma pastes it: a blank line between every line. */
const pasted = (...lines: string[]) => parseEventProse(lines.join('\n\n'))

/** Every word the parser gave back, to check against the words it was given. */
function wordsOut(prose: EventProse): string[] {
  const texts = prose.sections.flatMap((section) => [
    section.heading ?? '',
    ...section.blocks.flatMap((block) => {
      if (block.kind === 'paragraph') return [block.text]
      if (block.kind === 'list') return block.items
      if (block.kind === 'facts') return block.rows.flatMap((row) => [row.key, row.value])
      return block.people.flatMap((person) => [person.name, person.role])
    }),
  ])
  return words([...texts, ...prose.hostedBy].join(' '))
}
const words = (text: string) => (text.match(/[\p{L}\p{N}]+/gu) ?? []).toSorted()

test('an ordinary two-paragraph description stays two paragraphs', () => {
  for (const id of [1, 2, 3, 4, 5, 6, 91]) {
    const event = fixture(id)
    const prose = parseFixture(id)
    assert.deepEqual(shape(prose), [[null, ['p', 'p']]], `event ${id}`)
    assert.deepEqual(
      prose.sections[0].blocks.map((block) => block.kind === 'paragraph' && block.text),
      event.description.split('\n\n'),
      `event ${id}`,
    )
    assert.deepEqual(prose.hostedBy, [], `event ${id}`)
  }
})

test('no description gives no sections', () => {
  assert.deepEqual(parseFixture(92), { sections: [], hostedBy: [] })
  assert.deepEqual(parseEventProse(null), { sections: [], hostedBy: [] })
  assert.deepEqual(parseEventProse('  \n\n '), { sections: [], hostedBy: [] })
})

test('event 8: the Luma paste reads as speaker, list, facts and hosts', () => {
  const event = fixture(8)
  const prose = parseFixture(8)
  assert.deepEqual(shape(prose), [
    ['Speaker', ['people1']],
    ['What to expect', ['list3']],
    ['Details', ['facts3']],
  ])
  assert.deepEqual(prose.sections[0].blocks[0], {
    kind: 'people',
    people: [{ name: 'Eric Silver', role: 'Co-founder, Mass Magnetics (YC)' }],
  })
  // The Date row repeats the event's own day and goes; Time, Place and Cost stay as written.
  assert.deepEqual(prose.sections[2].blocks[0], {
    kind: 'facts',
    rows: [
      { key: 'Time', value: 'Evening (exact time shared with approved guests)' },
      { key: 'Place', value: 'Boston University (exact room shared with approved guests)' },
      { key: 'Cost', value: 'Free, approval required' },
    ],
  })
  assert.deepEqual(prose.hostedBy, ['Jose Cruz', 'Rionium', 'BU Proto'])
  assert.deepEqual(mergeHosts(event.hosts, prose.hostedBy), [
    { name: 'Jose Cruz', href: 'https://luma.com/cjxsez' },
    { name: 'Rionium', href: null },
    { name: 'BU Proto', href: null },
  ])
})

test('event 7: list, facts and hosts, with the lede dropped from the write-up', () => {
  const event = fixture(7)
  const prose = parseFixture(7)
  assert.deepEqual(shape(prose), [
    ['What to expect', ['list3']],
    ['Details', ['facts3']],
  ])
  assert.deepEqual(prose.sections[0].blocks[0], {
    kind: 'list',
    items: [
      '45-minute fireside chat with Kent',
      '30 minutes of audience Q&A',
      'A chance to meet student builders from BU, Wellesley, Tufts, BC, and across Boston',
    ],
  })
  // Split at the first colon with a space after it, so the time keeps its own colons.
  assert.deepEqual(prose.sections[1].blocks[0].kind === 'facts' && prose.sections[1].blocks[0].rows[0], {
    key: 'Time',
    value: '5:00-6:30 PM ET',
  })
  assert.deepEqual(
    mergeHosts(event.hosts, prose.hostedBy).map((host) => host.name),
    ['Jose Cruz', 'Kent Bennett', 'BU Cybersecurity Association'],
  )
})

test('the opening paragraph goes only when it is the lede', () => {
  const event = fixture(8)
  const kept = parseEventProse(event.description, { lede: 'Something else.' })
  assert.deepEqual(shape(kept)[0], [null, ['p']])
  // Spacing, capitals and a closing full stop don't make it a different paragraph.
  assert.deepEqual(shape(parseEventProse('Bring a project.\n\nFood at 7.', { lede: ' bring a  project' })), [[null, ['p']]])
  assert.deepEqual(shape(parseEventProse('Bring a project.', { lede: 'Bring a project.' })), [])
  assert.deepEqual(shape(parseEventProse('Bring a project.', { lede: '' })), [[null, ['p']]])
})

test('event 93: a short item is never a heading because a sentence follows it', () => {
  const prose = parseFixture(93)
  assert.deepEqual(prose.sections, [
    { heading: null, blocks: [{ kind: 'paragraph', text: 'A longer hack night for the week after midterms. Come with whatever you’re building.' }] },
    {
      heading: 'What to bring',
      blocks: [
        { kind: 'list', items: ['Laptop', 'Charger'] },
        { kind: 'paragraph', text: 'We provide food and drinks all night.' },
      ],
    },
  ])
})

test('a lone short line over ordinary prose stays a paragraph', () => {
  assert.deepEqual(shape(pasted('Free pizza', 'Come hang out and build. Bring a laptop.')), [[null, ['p', 'p']]])
  assert.deepEqual(shape(pasted('Hey builders', 'We are back for another hack night. Bring a project or find one.', 'See you there')), [
    [null, ['p', 'p', 'p']],
  ])
  assert.deepEqual(
    shape(pasted('We build things on Thursdays. Everyone is welcome.', 'No experience needed', 'Seriously, come with nothing and we will find you a team.')),
    [[null, ['p', 'p', 'p']]],
  )
  assert.deepEqual(shape(pasted('Here is the plan:', 'We meet at CDS, walk to the bus, and ride down together. Bring a jacket.')), [[null, ['p', 'p']]])
  // Two short lines and nothing else: too little to call one of them a heading.
  assert.deepEqual(shape(pasted('We meet weekly.', 'Free pizza', 'Bring a friend')), [[null, ['p', 'p', 'p']]])
  // A short last line has nothing under it.
  assert.deepEqual(shape(pasted('We meet weekly.', 'See you there')), [[null, ['p', 'p']]])
})

test('a known heading is a heading with nothing else to go on', () => {
  assert.deepEqual(shape(pasted('We meet weekly.', 'What to bring', 'A laptop and a charger. We have the rest.')), [
    [null, ['p']],
    ['What to bring', ['p']],
  ])
  assert.deepEqual(shape(pasted('What to expect:', 'Three short demos, then questions from the room.')), [['What to expect', ['p']]])
})

test('a short line becomes a heading when the text shows other structure', () => {
  // A second heading-shaped line.
  assert.deepEqual(
    shape(pasted('A workshop.', 'Who is this for?', 'Anyone who has written a little code and wants to ship something real.', 'What do I need?', 'A laptop and a GitHub account.')),
    [
      [null, ['p']],
      ['Who is this for?', ['p']],
      ['What do I need?', ['p']],
    ],
  )
  // A facts table.
  assert.deepEqual(shape(pasted('Getting in', 'Doors are on the Comm Ave side. Bring your BU ID.', 'Date: Friday', 'Cost: Free')), [
    ['Getting in', ['p', 'facts2']],
  ])
  // Typed bullets, straight under the line.
  assert.deepEqual(shape(parseEventProse('What you will do:\n- Build a thing\n- Ship it\n- Demo it\n\nFood provided.')), [
    ['What you will do', ['list3', 'p']],
  ])
})

test('in a run of short lines the first is the heading and the rest its items', () => {
  const night = pasted('Intro sentence here.', 'On the night', 'Fireside chat', 'Audience Q&A', 'Free pizza')
  assert.deepEqual(night.sections, [
    { heading: null, blocks: [{ kind: 'paragraph', text: 'Intro sentence here.' }] },
    { heading: 'On the night', blocks: [{ kind: 'list', items: ['Fireside chat', 'Audience Q&A', 'Free pizza'] }] },
  ])
  // The same run opening the text.
  assert.deepEqual(shape(pasted('On the night', 'Fireside chat', 'Audience Q&A', 'Free pizza')), [['On the night', ['list3']]])
  assert.deepEqual(shape(pasted('Join us for demo night. Five minutes each.', 'Thanks to our sponsors', 'Rionium', 'Mass Magnetics')), [
    [null, ['p']],
    ['Thanks to our sponsors', ['list2']],
  ])
  // Known headings close one list and open the next; an unknown one over a table does too.
  assert.deepEqual(shape(pasted('What to expect', 'Fireside chat', 'Audience Q&A', 'Free pizza', 'Details', 'Date: Friday', 'Cost: Free')), [
    ['What to expect', ['list3']],
    ['Details', ['facts2']],
  ])
  assert.deepEqual(shape(pasted('On the night', 'Fireside chat', 'Audience Q&A', 'Getting in', 'Date: Friday', 'Cost: Free')), [
    ['On the night', ['list2']],
    ['Getting in', ['facts2']],
  ])
})

test('two heading-shaped lines in a row are never both headings', () => {
  const pairs = pasted('Join us for a talk on hardware.', 'Cost', 'Free', 'Where', 'CDS 1101')
  assert.deepEqual(shape(pairs), [
    [null, ['p']],
    ['Cost', ['p']],
    ['Where', ['p']],
  ])
  // "Details" directly under "What to expect" is its first item, not a second heading.
  assert.deepEqual(shape(pasted('What to expect', 'Details', 'Come by any time after six. Food is on us.')), [['What to expect', ['p', 'p']]])
})

test('short lines with no heading over them are a plain list, or stay paragraphs', () => {
  assert.deepEqual(shape(pasted('Come build with us.', '6:00 Doors open', '6:30 Demos', '8:00 Pizza')), [[null, ['p', 'list3']]])
  assert.deepEqual(shape(pasted('We are hosting a workshop on agents.', 'Register here: https://luma.com/abc', 'Questions? Email hello@buproto.com')), [
    [null, ['p', 'p', 'p']],
  ])
})

test('people lines sit under a speaker heading only', () => {
  const speakers = pasted('Speakers', 'Ada Park, CTO, Loop', 'Sam Li', 'Agenda', '6:00 Doors', '6:15 Talks', 'See you there!')
  assert.deepEqual(speakers.sections, [
    {
      heading: 'Speakers',
      blocks: [
        {
          kind: 'people',
          people: [
            { name: 'Ada Park', role: 'CTO, Loop' },
            { name: 'Sam Li', role: '' },
          ],
        },
      ],
    },
    {
      heading: 'Agenda',
      blocks: [
        { kind: 'list', items: ['6:00 Doors', '6:15 Talks'] },
        { kind: 'paragraph', text: 'See you there!' },
      ],
    },
  ])
})

test('facts need two rows that do not read as sentences', () => {
  assert.deepEqual(shape(pasted('Come build with us this Thursday.', 'Note: doors close at 7')), [[null, ['p', 'p']]])
  assert.deepEqual(shape(pasted('We meet weekly.', 'Remember: bring your laptop.', 'Also: there is pizza.')), [[null, ['p', 'p', 'p']]])
  assert.deepEqual(shape(pasted('We meet weekly.', 'Time: 7 PM', 'Cost: Free')), [[null, ['p', 'facts2']]])
  // Typed with single line breaks, under their own heading.
  assert.deepEqual(parseEventProse('Details\nTime: 7 PM\nCost: Free').sections, [
    {
      heading: 'Details',
      blocks: [
        {
          kind: 'facts',
          rows: [
            { key: 'Time', value: '7 PM' },
            { key: 'Cost', value: 'Free' },
          ],
        },
      ],
    },
  ])
})

test('a Date fact goes only when it is the event’s own day and nothing more', () => {
  const rows = (value: string, date = '2026-11-20') => {
    const prose = parseEventProse(`Details\n\nDate: ${value}\n\nCost: Free`, { date })
    const block = prose.sections[0].blocks[0]
    return block.kind === 'facts' ? block.rows.map((row) => row.key) : []
  }
  for (const same of ['Friday, November 20, 2026', 'November 20', 'Nov 20, 2026', 'Fri, Nov. 20th', '20 November 2026', '11/20/2026', '11/20', '2026-11-20']) {
    assert.deepEqual(rows(same), ['Cost'], same)
  }
  for (const other of ['Friday, November 21, 2026', 'November 20, 2027', 'November 20 at 6 PM', 'November 20-21', 'Friday', 'TBA', '20/11/2026']) {
    assert.deepEqual(rows(other), ['Date', 'Cost'], other)
  }
  // Without the event's date there is nothing to compare with.
  assert.deepEqual(shape(parseEventProse('Details\n\nDate: November 20\n\nCost: Free')), [['Details', ['facts2']]])
  // A table that was only the date leaves nothing, so its heading goes with it.
  assert.deepEqual(shape(parseEventProse('Come by.\n\nDetails\n\nDate: November 20\nDate: Nov 20', { date: '2026-11-20' })), [[null, ['p']]])
})

test('"Hosted by" is lifted only when it is a bare list of names', () => {
  assert.deepEqual(pasted('A night of demos.', 'Hosted by Jose Cruz | Rionium | BU Proto').hostedBy, ['Jose Cruz', 'Rionium', 'BU Proto'])
  assert.deepEqual(pasted('A night of demos.', 'Hosted by Jose Cruz and BU Proto').hostedBy, ['Jose Cruz', 'BU Proto'])
  assert.deepEqual(pasted('A night of demos.', 'Hosted by: Spark!, Innovate@BU, and BU Proto').hostedBy, ['Spark!', 'Innovate@BU', 'BU Proto'])
  assert.deepEqual(shape(pasted('A night of demos.', 'Hosted by BU Proto')), [[null, ['p']]])

  for (const prose of [
    'Hosted by the BU Proto board, with food from Rionium.',
    'Hosted by the BU Proto board, with food from Rionium',
    'Hosted by BU Proto.',
    'Hosted by BU Proto\nin the Kilachand Center',
  ]) {
    const kept = pasted('A night of demos.', prose)
    assert.deepEqual(kept.hostedBy, [], prose)
    assert.deepEqual(kept.sections[0].blocks.at(-1), { kind: 'paragraph', text: prose }, prose)
  }
  // Only as the closing line.
  const opening = pasted('Hosted by BU Proto, this night is for anyone who builds.', 'Come by.')
  assert.deepEqual(opening.hostedBy, [])
  assert.deepEqual(shape(opening), [[null, ['p', 'p']]])
})

test('line breaks typed inside a block are kept', () => {
  assert.deepEqual(parseEventProse('Line one of a poem\nLine two of a poem\n\nSecond paragraph here.').sections, [
    {
      heading: null,
      blocks: [
        { kind: 'paragraph', text: 'Line one of a poem\nLine two of a poem' },
        { kind: 'paragraph', text: 'Second paragraph here.' },
      ],
    },
  ])
  assert.deepEqual(parseEventProse('- a laptop\n• a charger\n* a friend\r\n\r\nSee you there.').sections, [
    {
      heading: null,
      blocks: [
        { kind: 'list', items: ['a laptop', 'a charger', 'a friend'] },
        { kind: 'paragraph', text: 'See you there.' },
      ],
    },
  ])
  // Bullets mixed into running text are left exactly as typed.
  assert.deepEqual(parseEventProse('We will cover\n- git\nand a little more.').sections, [
    { heading: null, blocks: [{ kind: 'paragraph', text: 'We will cover\n- git\nand a little more.' }] },
  ])
})

test('mergeHosts keeps the event’s own hosts first and skips names it already has', () => {
  const hosts = [{ name: 'BU Proto', href: 'https://buproto.com' }]
  assert.deepEqual(mergeHosts(hosts, ['bu proto', 'Rionium', 'rionium']), [
    { name: 'BU Proto', href: 'https://buproto.com' },
    { name: 'Rionium', href: null },
  ])
  assert.deepEqual(mergeHosts([], []), [])
})

test('no words are lost, beyond the three documented cases', () => {
  const awkward = [
    'Free pizza\n\nCome hang out and build. Bring a laptop.',
    'Come build\n\nCome learn\n\nCome eat',
    'A fireside chat.\n\nAgenda\n\n6:00 PM Doors open\n\n6:30 PM Fireside\n\n7:30 PM Networking\n\nSee you there!',
    'What you will do:\n- Build a thing\n- Ship it\n- Demo it\n\nFood provided.',
    'A workshop.\n\nWhat you will walk away with\n\nA deployed app\n\nA team for the next hackathon\n\nNew friends',
    'Eric Silver\n\nEric is the co-founder of Mass Magnetics. He studied materials at MIT.\n\nKent Bennett\n\nKent is a partner at Bessemer.',
    'Speakers\n\nDetails\n\nWhat to expect\n\nAgenda',
    'Details\n\nNote: doors close at 7\n\nWhere\n\nWhen',
    'Hosted by the BU Proto board, with food from Rionium.',
    'Bring:\n- a laptop\n- a charger\n\nSee you there.\n\nHosted by A | B',
  ]
  for (const description of awkward) {
    assert.deepEqual(wordsOut(parseEventProse(description)), words(description.replace(/^Hosted by (?=A )/m, '')), description)
  }
  for (const event of fixtures) {
    // With no lede and no date nothing may go at all: "Hosted by" comes back as the names.
    const expected = words(event.description.replace(/^Hosted by /m, ''))
    assert.deepEqual(wordsOut(parseEventProse(event.description)), expected, `event ${event.id}`)
  }
})
