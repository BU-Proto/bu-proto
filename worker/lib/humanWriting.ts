// Emails Claude writes for Proto have to read like a person wrote them. The rules are the
// human-writing skill's (from Wikipedia's "Signs of AI writing" list), as Claude is told them, plus a
// check in code for the ones a program can see. A draft that fails the check goes back to Claude
// once with what it broke; quotes are straightened here, whatever Claude did.

/** The rules, as they go into Claude's instructions. Plain text emails, so nothing about headings or Markdown. */
export const HUMAN_WRITING_RULES = `Write like a person, not like an AI. Check every email against all of these before you answer.

What it says
- Don't puff up importance, legacy or "broader trends", and don't place anything in "debates" or "discussions".
- Don't pile on claims of fame, reach or press coverage.
- No "-ing" tails that add shallow analysis ("..., highlighting its impact").
- No vague "connected to" or "associated with": say what the link is.
- No weasel attributions ("experts say", "many believe").
- No "despite X, it faces challenges" passages, and no upbeat look ahead at the end.

Words and grammar
- Never use these words: additionally, boasts, bolstered, crucial, delve, emphasizing, enduring, garner, intricate, intricacies, interplay, key (as an adjective), landscape (figurative), meticulously, pivotal, underscore, tapestry, testament, valuable, vibrant, align with, enhance, fostering, foster, highlighting, showcasing, challenge (as a vague noun), clearer, dependable, echoed, leverage, matters, multifaceted, practical, prioritize, quietly, steady, universally, seamless, causal, empirical, correlate.
- Use plain "is", "are" and "has", not "serves as", "stands as", "marks", "features" or "offers" in their place.
- No negative parallels: "not just X, but also Y", "not X, but Y", "it's not X, it's Y", "no X, no Y, just Z", "Y rather than X".
- No groups of three (three adjectives, three short phrases) used to sound thorough.
- Don't force every sentence into the same short, clipped rhythm.

Punctuation
- No em dashes or en dashes used as dashes. Use a comma, a colon, parentheses or a new sentence.
- Straight quotes and apostrophes (" and '), never curly ones.
- No bold, no Markdown, no emoji, no "---" dividers, and never a placeholder like [Name], TBD or "XX".

Talking to the reader
- No chatbot chatter: "Certainly!", "Great question", "I hope this helps", "I hope this email finds you well", "Let me know if you have any questions", "Feel free to reach out", "Please don't hesitate".
- No hedges: "it's important to note", "please note that".
- No closing paragraph that restates the email. No press-release or brochure tone.
- Never a made-up link, number, date, quote or name.

What people do
- Simple "there is", "it has". Plain words: wrote, moved, used, tried (not authored, relocated, utilized, attempted).
- Ordinary qualifiers are fine: very, perhaps, tends to. A plain superlative only when it's true.
- Say the thing once, in the fewest plain words, and stop.`

// The banned words a program can match without reading for meaning. "key", "landscape",
// "challenge" and "matters" are left to Claude: they're fine in their ordinary sense.
const BANNED_WORDS = [
  'additionally',
  'boasts',
  'bolstered',
  'crucial',
  'delve',
  'delves',
  'delving',
  'emphasizing',
  'enduring',
  'garner',
  'garnered',
  'intricate',
  'intricacies',
  'interplay',
  'meticulously',
  'pivotal',
  'underscore',
  'underscores',
  'tapestry',
  'testament',
  'valuable',
  'vibrant',
  'align with',
  'aligns with',
  'enhance',
  'enhances',
  'enhancing',
  'fostering',
  'foster',
  'fosters',
  'highlighting',
  'showcasing',
  'clearer',
  'dependable',
  'echoed',
  'leverage',
  'leveraging',
  'multifaceted',
  'practical',
  'prioritize',
  'quietly',
  'steady',
  'universally',
  'seamless',
  'seamlessly',
  'causal',
  'empirical',
  'correlate',
]

const PHRASES: { pattern: RegExp; say: string }[] = [
  { pattern: /\b(serves|stands) as\b/i, say: '"serves as" / "stands as": use "is"' },
  { pattern: /\bnot (just|only) [^.!?\n]{1,80}\bbut( also)?\b/i, say: 'a "not just X, but Y" parallel' },
  { pattern: /\bit['’]s not [^.!?\n]{1,60}, it['’]s\b/i, say: 'an "it\'s not X, it\'s Y" parallel' },
  { pattern: /\brather than\b/i, say: 'a "Y rather than X" parallel' },
  { pattern: /\bhope (this|that) (email |message |note )?finds you\b/i, say: '"I hope this finds you well"' },
  { pattern: /\bhope this helps\b/i, say: '"I hope this helps"' },
  { pattern: /\b(let me know|feel free to (reach out|let me know)|don['’]t hesitate)[^.!?\n]{0,40}\b(any )?questions\b/i, say: '"let me know if you have any questions" chatter' },
  { pattern: /\bdon['’]t hesitate\b/i, say: '"don\'t hesitate"' },
  { pattern: /\b(certainly|absolutely|great question)!/i, say: 'chatbot chatter ("Certainly!")' },
  { pattern: /\bit['’]s (important|worth) (to note|noting)\b/i, say: '"it\'s important to note"' },
  { pattern: /\bin conclusion\b/i, say: '"In conclusion"' },
  { pattern: /\bin today['’]s [a-z]+ (world|landscape|age)\b/i, say: '"in today\'s ... world"' },
]

/** Curly quotes become straight ones; nothing else is changed. */
export function straighten(text: string): string {
  return text.replace(/[‘’‚′]/g, "'").replace(/[“”„″]/g, '"')
}

/**
 * The rules a draft breaks that a program can see, one line each for Claude to fix. Empty when
 * it passes. Things that need reading for meaning (groups of three, puffery) are Claude's to watch.
 */
export function writingProblems(text: string): string[] {
  const problems: string[] = []
  const lower = text.toLowerCase()
  const words = BANNED_WORDS.filter((word) => new RegExp(`\\b${word.replace(' ', '\\s+')}\\b`, 'i').test(lower))
  if (words.length) problems.push(`Words that aren't allowed: ${words.map((word) => `"${word}"`).join(', ')}`)
  if (/[—―]|\s–\s|\s--\s/.test(text)) problems.push('A dash used as punctuation (— or – or --): use a comma, a colon, parentheses or a new sentence')
  if (/[‘’“”]/.test(text)) problems.push('Curly quotes: use straight " and \'')
  if (/\*\*|__|^#{1,6}\s|^\s*---\s*$/m.test(text)) problems.push('Markdown (bold, headings or --- dividers): plain text only')
  if (/\[[A-Za-z][^\]\n]{0,40}\]|\bTBD\b|\bXX+\b|\b20\d\d-xx/i.test(text)) problems.push('A placeholder like [Name], TBD or XX: write around what you don\'t know and ask instead')
  if (/\p{Extended_Pictographic}/u.test(text)) problems.push('An emoji')
  for (const { pattern, say } of PHRASES) if (pattern.test(text)) problems.push(say)
  return problems
}
