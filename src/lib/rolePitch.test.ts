// npm test: a role's write-up read into the sections its page sets as ruled rows, the way the
// board seats' pitches are. The Scout write-up is the one posted in the portal.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseRolePitch } from './rolePitch.ts'

const SCOUT = `Some of the best builders at BU never show up to a club meeting. They're shipping side projects in their dorm, winning hackathons nobody hears about, or quietly starting companies. Scouts find them.

You'd keep an eye on your corner of campus, whether that's your major, your classes, your lab, or your friend group, and point the people building things toward Proto.

What you'd do
Find students who are building projects or startups
Bring them to Proto events and into the community
Send us member wins for the site
Recommend builders for hackathon funding

Who it suits
You already know who's building what around you. You like meeting people and you don't mind reaching out first.

What you get
Early access to the best builders at BU
A say in who Proto backs`

test('the Scout write-up: two paragraphs, then three sections', () => {
  const pitch = parseRolePitch(SCOUT)
  assert.match(pitch.intro, /^Some of the best builders/)
  assert.match(pitch.intro, /toward Proto\.$/)
  assert.equal(pitch.intro.split('\n\n').length, 2)
  assert.deepEqual(
    pitch.sections.map((section) => [section.heading, section.items.length]),
    [
      ["What you'd do", 4],
      ['Who it suits', 1],
      ['What you get', 2],
    ],
  )
  assert.equal(pitch.sections[0].items[3], 'Recommend builders for hackathon funding')
})

test('headings with colons, a blank line after every line, bullets and numbers', () => {
  const pitch = parseRolePitch(
    'Scouts find them.\n\nWhat you’d do:\n\n- Find builders\n\n- Bring them in\n\nFirst month:\n\n1. Recruit 2 scouts\n\n2. Post 5 spotlights\n\nWho it suits:\n\nYou know who’s building what.',
  )
  assert.equal(pitch.intro, 'Scouts find them.')
  assert.deepEqual(pitch.sections, [
    { heading: 'What you’d do', items: ['Find builders', 'Bring them in'], ordered: false },
    { heading: 'First month', items: ['Recruit 2 scouts', 'Post 5 spotlights'], ordered: true },
    { heading: 'Who it suits', items: ['You know who’s building what.'], ordered: false },
  ])
})

test('markdown headings lose their marks', () => {
  const pitch = parseRolePitch('## What you get\n- A say\n\n**Who it suits**\nAnyone.')
  assert.deepEqual(
    pitch.sections.map((section) => section.heading),
    ['What you get', 'Who it suits'],
  )
})

test('plain paragraphs stay a write-up', () => {
  const text = 'We need someone to run the sign-up desk.\n\nIt takes about an hour a week.'
  assert.deepEqual(parseRolePitch(text), { intro: text, sections: [] })
})

test('a short line on its own without a colon is not a heading', () => {
  const text = 'Come build with us\n\nWe meet on Thursdays.'
  assert.deepEqual(parseRolePitch(text), { intro: text, sections: [] })
})

test('nothing written gives nothing', () => {
  assert.deepEqual(parseRolePitch(''), { intro: '', sections: [] })
  assert.deepEqual(parseRolePitch('   \n\n '), { intro: '', sections: [] })
})
