// npm test: the human-writing check that every email Claude drafts goes through. Plain emails pass;
// each sign of AI writing a program can see is caught, so the draft goes back to Claude to fix.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { straighten, writingProblems } from './humanWriting.ts'

const PLAIN = `Hi Dana,

I'm Andres from Proto, a group of BU students who build things together. Could we use the Spark! lounge for hack night on Thursday, December 4, from 6 to 9 PM? We expect about 40 people and will bring our own food.

I've attached the filled-in space request form. It still needs our officer's signature, which I'll send by Monday.

Thanks,`

test('a plain email passes', () => {
  assert.deepEqual(writingProblems(PLAIN), [])
})

test('{{variables}} are not placeholders', () => {
  assert.deepEqual(writingProblems('Hi {{name}},\n\nSee you at {{event}} on {{eventDate}}.\n\nProto'), [])
})

test('banned words are caught, whole words only', () => {
  const problems = writingProblems('This is a crucial and vibrant opportunity to foster community.')
  assert.equal(problems.length, 1)
  assert.match(problems[0], /"crucial"/)
  assert.match(problems[0], /"vibrant"/)
  assert.match(problems[0], /"foster"/)
  // "Additionally" in any case; "keyboard" is not "key", "steadying" is not "steady".
  assert.match(writingProblems('Additionally, we need chairs.')[0], /"additionally"/)
  assert.deepEqual(writingProblems('Bring a keyboard, and a steadying hand.'), [])
})

test('dashes used as punctuation are caught, hyphens and ranges are not', () => {
  assert.equal(writingProblems('We need a room — a big one.').length, 1)
  assert.equal(writingProblems('We need a room – a big one.').length, 1)
  assert.equal(writingProblems('We need a room -- a big one.').length, 1)
  assert.deepEqual(writingProblems('A first-time hacker, 6-9 PM, pages 2–4.'), [])
})

test('curly quotes are caught, and straightened', () => {
  assert.equal(writingProblems('We’re “ready”.').length, 1)
  assert.equal(straighten('We’re “ready”.'), 'We\'re "ready".')
})

test('negative parallels and "serves as" are caught', () => {
  assert.ok(writingProblems('It is not just a hack night, but also a place to meet people.').some((line) => line.includes('not just')))
  assert.ok(writingProblems('We meet in person rather than online.').some((line) => line.includes('rather than')))
  assert.ok(writingProblems('The lounge serves as our home base.').some((line) => line.includes('serves as')))
})

test('chatbot chatter is caught', () => {
  assert.ok(writingProblems('I hope this email finds you well.').length > 0)
  assert.ok(writingProblems('Let me know if you have any questions.').length > 0)
  assert.ok(writingProblems('Please don’t hesitate to reach out.').length > 0)
  assert.ok(writingProblems('It’s important to note that the room closes at 9.').some((line) => line.includes('important to note')))
})

test('placeholders, Markdown and emoji are caught', () => {
  assert.ok(writingProblems('Hi [Name], the event is on 2026-xx-12.').some((line) => line.includes('placeholder')))
  assert.ok(writingProblems('The date is TBD.').some((line) => line.includes('placeholder')))
  assert.ok(writingProblems('This is **really** important.').some((line) => line.includes('Markdown')))
  assert.ok(writingProblems('See you there \u{1F389}').some((line) => line.includes('emoji')))
})
