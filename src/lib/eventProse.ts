// An event's write-up is stored as plain text. One pasted from Luma arrives with a blank line
// between every line, its sub-headings, list items and "Key: value" rows all looking like short
// paragraphs. This reads the structure back out of the text, so the page can set a list as a list
// and a fact as a fact. A pure function with no DOM, and conservative: whatever it isn't sure of
// stays an ordinary paragraph, and the only text it ever leaves out is listed on parseEventProse.

/** One piece of a write-up, in the order it was written. */
export type ProseBlock =
  /** Running text. Line breaks typed inside it are kept (`\n`). */
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  /** "Key: value" rows: "Cost: Free, approval required". */
  | { kind: 'facts'; rows: { key: string; value: string }[] }
  /** Lines under "Speaker": the name, and the role after its first comma ('' when there's none). */
  | { kind: 'people'; people: { name: string; role: string }[] }

/** A run of blocks, under the sub-heading the text gave it (null for what comes before the first). */
export interface ProseSection {
  heading: string | null
  blocks: ProseBlock[]
}

export interface EventProse {
  sections: ProseSection[]
  /** Names from a closing "Hosted by A | B | C" line, for the Hosts list. */
  hostedBy: string[]
}

export interface ProseContext {
  /** The event's summary. The head shows it as the lede, so a write-up that opens with it again loses that paragraph. */
  lede?: string | null
  /** The event's ISO day, so a "Date" fact that only repeats it is left out. */
  date?: string | null
}

/** Short lines that are a heading wherever they stand, whatever the rest of the text looks like. */
const KNOWN_HEADINGS = new Set([
  'about',
  'about the event',
  'about this event',
  'about the speaker',
  'about the speakers',
  'agenda',
  'cost',
  'details',
  'faq',
  'food',
  'format',
  'location',
  'logistics',
  'prizes',
  'requirements',
  'schedule',
  'speaker',
  'speakers',
  'sponsors',
  'what to bring',
  'what to expect',
  'when',
  'where',
  'who should attend',
  'who should come',
])

/** Under these headings a "Name, role" line is a person. */
const PEOPLE_HEADING = /^(speakers?|guests?|panelists?|panel|moderators?|judges?|mentors?|featuring)$/i

/** A bullet someone typed at the start of a line. */
const BULLET = /^[-*•–—]\s+/

/** "Key: value" with a key of one to three plain words. */
const FACT = /^([A-Z][A-Za-z'’]*(?: [A-Za-z'’&/-]+){0,2}):\s+(\S.*)$/

const HOSTED_BY = /^hosted by:?\s+(\S.*)$/i

const HEADING_MAX_CHARS = 40
const HEADING_MAX_WORDS = 6
const SHORT_LINE_MAX_CHARS = 160
const NAME_MAX_CHARS = 40
const NAME_MAX_WORDS = 5

const squash = (value: string) => value.replace(/\s+/g, ' ').trim()
const wordCount = (value: string) => value.split(/\s+/).filter(Boolean).length
const isKnownHeading = (heading: string) => KNOWN_HEADINGS.has(heading.toLowerCase())

/** The same text, give or take spacing, capitals and a closing full stop. */
const sameText = (a: string, b: string) => {
  const bare = (value: string) => squash(value).toLowerCase().replace(/\.$/, '')
  return bare(a) === bare(b)
}

/** The character a line ends on, ignoring a closing bracket or quote. */
const lastChar = (line: string) => line.replace(/[)\]"'”’]+$/, '').slice(-1)

// ---- Reading the text into units ---------------------------------------------------------------

/** What one stretch of the text looks like on its own, before its neighbours are considered. */
type Unit =
  | { type: 'para'; text: string }
  | { type: 'items'; items: string[] }
  | { type: 'facts'; rows: { key: string; value: string }[] }
  | {
      type: 'line'
      text: string
      /** The line as a heading (its closing colon dropped), when it is shaped like one. */
      heading: string | null
      /** Short and unfinished, the way a list item is: no closing full stop or question mark. */
      fragment: boolean
      /** Its two halves, when it reads "Key: value". */
      fact: { key: string; value: string } | null
    }

type Line = Extract<Unit, { type: 'line' }>

function readFact(line: string): { key: string; value: string } | null {
  const match = FACT.exec(line)
  if (!match) return null
  const value = match[2].trim()
  // A value that closes like a sentence is a sentence: "Remember: bring your laptop."
  if (/[.!?]/.test(lastChar(value))) return null
  return { key: match[1], value }
}

function headingShape(line: string): string | null {
  const bare = line.replace(/:$/, '').trim()
  if (bare.length === 0 || bare.length > HEADING_MAX_CHARS || wordCount(bare) > HEADING_MAX_WORDS) return null
  // A capital first, and nothing a sentence, a link or a "Name, role" line would have.
  if (!/^[A-Z]/.test(bare) || /[.,;:!|@/]/.test(bare) || HOSTED_BY.test(bare)) return null
  // "Who is this for?" is a heading; a question mark anywhere else isn't.
  if (bare.slice(0, -1).includes('?')) return null
  return bare
}

function readLine(line: string): Unit {
  const fact = readFact(line)
  const fragment = line.length <= SHORT_LINE_MAX_CHARS && !/[.!?;:,]/.test(lastChar(line))
  const heading = fact ? null : headingShape(line)
  if (!fragment && !heading) return { type: 'para', text: line }
  return { type: 'line', text: line, heading, fragment, fact }
}

/**
 * One blank-line-separated block as units. A block typed with single line breaks is split only
 * where every line says what it is (bullets, or "Key: value" rows, with a short line over them at
 * most); anything else stays one paragraph with its line breaks.
 */
function readBlock(block: string): Unit[] {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 1) return [readLine(lines[0])]

  const asItems = (bullets: string[]): Unit => ({ type: 'items', items: bullets.map((line) => line.replace(BULLET, '')) })
  const allBullets = (some: string[]) => some.length > 0 && some.every((line) => BULLET.test(line))
  const allFacts = (some: string[]) => some.length > 1 && some.every((line) => readFact(line))

  if (allBullets(lines)) return [asItems(lines)]
  if (allFacts(lines)) return lines.map(readLine)
  const [first, ...rest] = lines
  if (!BULLET.test(first) && allBullets(rest)) return [readLine(first), asItems(rest)]
  if (headingShape(first) && allFacts(rest)) return [readLine(first), ...rest.map(readLine)]
  return [{ type: 'para', text: lines.join('\n') }]
}

/** Two or more "Key: value" lines in a row become one facts unit; a lone one stays a line. */
function gatherFacts(units: Unit[]): Unit[] {
  const out: Unit[] = []
  let index = 0
  while (index < units.length) {
    const rows: { key: string; value: string }[] = []
    let end = index
    for (let unit = units[end]; unit?.type === 'line' && unit.fact; unit = units[++end]) rows.push(unit.fact)
    if (rows.length >= 2) {
      out.push({ type: 'facts', rows })
      index = end
    } else {
      out.push(units[index])
      index += 1
    }
  }
  return out
}

// ---- The two things lifted out of the text ---------------------------------------------------

/**
 * The names in a closing "Hosted by A | B | C", or null when the line is anything more than a
 * bare list of names: "Hosted by the BU Proto board, with food from Rionium." is a sentence.
 */
function hostNames(block: string): string[] | null {
  if (block.includes('\n') || /[.!?]$/.test(block)) return null
  const match = HOSTED_BY.exec(block)
  if (!match) return null
  const names = (match[1].includes('|') ? match[1].split('|') : match[1].split(/\s*,\s*(?:and\s+)?|\s+(?:and|&)\s+/)).map(squash)
  const isName = (name: string) =>
    /^[A-Z0-9]/.test(name) && name.length <= NAME_MAX_CHARS && wordCount(name) <= NAME_MAX_WORDS && !/[.:;]/.test(name)
  return names.length > 0 && names.every(isName) ? names : null
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const WEEKDAY = /\b(?:mon|tue|tues|wed|wednes|thu|thur|thurs|fri|sat|satur|sun)(?:day)?\b\.?/g

/**
 * Whether a "Date" fact's value is the event's own day and nothing more ("Friday, November 20,
 * 2026" for 2026-11-20). Anything it can't read for certain (a time added, a range, another
 * format) is not the same day, so the row is kept.
 */
function isSameDay(value: string, iso: string): boolean {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return false
  const rest = value.toLowerCase().replace(WEEKDAY, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

  const numeric = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(rest)
  if (numeric) return Number(numeric[1]) === month && Number(numeric[2]) === day && (!numeric[3] || Number(numeric[3]) === year)
  if (rest === iso) return true

  const monthFirst = /^([a-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?$/.exec(rest)
  const dayFirst = /^(\d{1,2})(?:st|nd|rd|th)? ([a-z]{3,9})\.?(?: (\d{4}))?$/.exec(rest)
  const [name, dayText, yearText] = monthFirst ? [monthFirst[1], monthFirst[2], monthFirst[3]] : dayFirst ? [dayFirst[2], dayFirst[1], dayFirst[3]] : []
  if (!name || !dayText) return false
  return MONTHS[month - 1].startsWith(name) && Number(dayText) === day && (!yearText || Number(yearText) === year)
}

// ---- Putting the units into sections ---------------------------------------------------------

/** Consecutive short lines. Only the first may be a question; the rest read like list items. */
interface Run {
  type: 'run'
  lines: Line[]
}

type Piece = Exclude<Unit, Line> | Run

function gatherRuns(units: Unit[]): Piece[] {
  const pieces: Piece[] = []
  for (const unit of units) {
    const last = pieces.at(-1)
    if (unit.type !== 'line') pieces.push(unit)
    else if (last?.type === 'run' && unit.fragment) last.lines.push(unit)
    else pieces.push({ type: 'run', lines: [unit] })
  }
  return pieces
}

/**
 * Whether a run's first line could head what follows it: a known heading with anything under it,
 * a lone short line over a paragraph, or the top of three or more short lines (a heading and its
 * list). Two short lines on their own are too little to tell apart from two short paragraphs.
 */
function canLead(run: Run, followed: boolean): boolean {
  const first = run.lines[0].heading
  if (!first) return false
  const hasContent = run.lines.length > 1 || followed
  if (isKnownHeading(first)) return hasContent
  return run.lines.length === 1 ? followed : run.lines.length >= 3
}

/**
 * Whether the text shows structure beyond a single short line: typed bullets, a facts table, a run
 * of three short lines, or a second line that could be a heading. Without any of that, a lone
 * "Free pizza" above a paragraph is just a short paragraph.
 */
function isStructured(pieces: Piece[]): boolean {
  if (pieces.some((piece) => piece.type === 'items' || piece.type === 'facts')) return true
  if (pieces.some((piece) => piece.type === 'run' && piece.lines.length >= 3)) return true
  const leads = pieces.filter((piece, index) => piece.type === 'run' && canLead(piece, index < pieces.length - 1))
  return leads.length >= 2
}

/** Which lines of a run are headings. Never two in a row: a heading needs something under it. */
function headingsIn(run: Run, next: Piece | undefined, structured: boolean): Set<number> {
  const found = new Set<number>()
  const { lines } = run
  const followed = next !== undefined
  lines.forEach((line, index) => {
    if (!line.heading || found.has(index - 1)) return
    const isLast = index === lines.length - 1
    if (isLast && !followed) return
    if (index === 0) {
      if (canLead(run, followed) && (isKnownHeading(line.heading) || structured)) found.add(index)
      return
    }
    // Further down a run a short line is a list item ("Laptop", "Charger"), unless it is a known
    // heading or the last line before a facts table or typed bullets.
    const overTable = isLast && (next?.type === 'facts' || next?.type === 'items')
    if (isKnownHeading(line.heading) || overTable) found.add(index)
  })
  return found
}

/** Short lines that sit together, as the block they make under the section they're in. */
function linesAsBlocks(lines: Line[], section: ProseSection, underHeading: boolean): ProseBlock[] {
  if (lines.length === 0) return []
  const texts = lines.map((line) => line.text)
  if (underHeading && section.heading && PEOPLE_HEADING.test(section.heading)) {
    const people = texts.map((text) => {
      const comma = text.indexOf(', ')
      return comma < 0 ? { name: text, role: '' } : { name: text.slice(0, comma), role: text.slice(comma + 2) }
    })
    if (people.every((person) => person.name.length <= NAME_MAX_CHARS && wordCount(person.name) <= NAME_MAX_WORDS)) {
      return [{ kind: 'people', people }]
    }
  }
  const isList = section.heading ? texts.length >= 2 : texts.length >= 3
  return isList ? [{ kind: 'list', items: texts }] : texts.map((text) => ({ kind: 'paragraph', text }))
}

/**
 * An event's description as sections of paragraphs, lists, facts and people.
 *
 * Three things are left out of the result, and nothing else: an opening paragraph that repeats
 * the event's lede (the head already shows it), a closing "Hosted by A | B" line (returned as
 * `hostedBy`, for the Hosts list), and a "Date" fact that only repeats the event's own day.
 */
export function parseEventProse(description: string | null | undefined, context: ProseContext = {}): EventProse {
  const blocks = (description ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length > 0 && context.lede?.trim() && sameText(blocks[0], context.lede)) blocks.shift()

  const hostedBy = (blocks.length > 0 && hostNames(blocks[blocks.length - 1])) || []
  if (hostedBy.length > 0) blocks.pop()

  const pieces = gatherRuns(gatherFacts(blocks.flatMap(readBlock)))
  const structured = isStructured(pieces)

  const sections: ProseSection[] = [{ heading: null, blocks: [] }]
  const current = () => sections[sections.length - 1]

  pieces.forEach((piece, pieceIndex) => {
    if (piece.type === 'para') current().blocks.push({ kind: 'paragraph', text: piece.text })
    else if (piece.type === 'items') current().blocks.push({ kind: 'list', items: piece.items })
    else if (piece.type === 'facts') {
      const { date } = context
      const rows = piece.rows.filter((row) => !(date && row.key.toLowerCase() === 'date' && isSameDay(row.value, date)))
      if (rows.length > 0) current().blocks.push({ kind: 'facts', rows })
    } else {
      const headings = headingsIn(piece, pieces[pieceIndex + 1], structured)
      let pending: Line[] = []
      let underHeading = false
      const flush = () => {
        current().blocks.push(...linesAsBlocks(pending, current(), underHeading))
        pending = []
      }
      piece.lines.forEach((line, index) => {
        if (!headings.has(index) || !line.heading) return pending.push(line)
        flush()
        sections.push({ heading: line.heading, blocks: [] })
        underHeading = true
      })
      flush()
    }
  })

  return { sections: sections.filter((section) => section.blocks.length > 0), hostedBy }
}

/**
 * The event's hosts, then the names from its "Hosted by" line that aren't among them already
 * (whatever the capitals). The event's own entries come first and keep their links.
 */
export function mergeHosts<Host extends { name: string }>(hosts: readonly Host[], hostedBy: readonly string[]): (Host | { name: string; href: null })[] {
  const merged: (Host | { name: string; href: null })[] = [...hosts]
  for (const name of hostedBy) {
    if (!merged.some((host) => sameText(host.name, name))) merged.push({ name, href: null })
  }
  return merged
}
