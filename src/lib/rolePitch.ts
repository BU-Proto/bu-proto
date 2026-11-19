// A role posted in the portal has one write-up, in plain text. The board seats get their pitch as
// ruled rows ("What you own", "What you get") from src/content/seats.ts; a role written in the
// portal often has the same shape typed into its write-up: a short heading line, then the lines
// under it. This reads those sections back out, so every role's page can set them as the same
// rows, whoever wrote them and wherever they live. A pure function, and conservative: a write-up
// with no headed sections comes back whole as `intro`, to be shown as it always was.

/** One headed section of a write-up: its heading, and the lines under it. */
export interface PitchSection {
  heading: string
  /** One line is said as a sentence; more are a list. */
  items: string[]
  /** The lines were numbered ("1. …"), so they're steps. */
  ordered: boolean
}

export interface RolePitch {
  /** What comes before the first heading, as written ('' when there's nothing). */
  intro: string
  sections: PitchSection[]
}

const HEADING_MAX_CHARS = 48
const HEADING_MAX_WORDS = 7

/** A bullet someone typed at the start of a line. */
const BULLET = /^[-*•–—]\s+/
/** A number someone typed at the start of a line: "1. ", "2) ". */
const NUMBER = /^\d{1,2}[.)]\s+/
/** Markdown someone may have typed around a heading: "## What you get", "**What you get**". */
const MARKDOWN_HEADING = /^#{1,6}\s+|^\*\*(.+)\*\*$|^__(.+)__$/

/** The heading a line reads as, or null when it reads as text. */
function headingOf(line: string): string | null {
  const text = line
    .trim()
    .replace(MARKDOWN_HEADING, (_, bold?: string, under?: string) => bold ?? under ?? '')
    .trim()
  const plain = text.replace(/:$/, '').trim()
  if (!plain || plain.length > HEADING_MAX_CHARS) return null
  if (plain.split(/\s+/).length > HEADING_MAX_WORDS) return null
  if (BULLET.test(plain) || NUMBER.test(plain)) return null
  // A sentence ends in its punctuation; a heading doesn't (bar a colon, taken off above).
  if (/[.!?;,…]$/.test(plain)) return null
  if (!/^[\p{L}\p{N}]/u.test(plain)) return null
  return plain
}

/** Lines between blank lines: the paragraphs as they were typed. */
function blocksOf(text: string): string[][] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((block) => block.length > 0)
}

/**
 * Where a heading starts. A heading-shaped line heads a section when it opens a paragraph and has
 * lines under it in the same paragraph ("What you get" then the list), or when it stands alone and
 * says so with a colon ("What you get:" then a blank line, as some editors paste). A short line on
 * its own with no colon stays text: it may be a sentence typed without a full stop.
 */
function headsSection(block: string[]): string | null {
  const heading = headingOf(block[0])
  if (!heading) return null
  if (block.length > 1) return heading
  return block[0].trim().endsWith(':') ? heading : null
}

export function parseRolePitch(description: string): RolePitch {
  const blocks = blocksOf(description)
  const intro: string[][] = []
  const sections: { heading: string; lines: string[] }[] = []

  for (const block of blocks) {
    const heading = headsSection(block)
    if (heading) {
      sections.push({ heading, lines: block.slice(1) })
    } else if (sections.length > 0) {
      sections[sections.length - 1].lines.push(...block)
    } else {
      intro.push(block)
    }
  }

  // A heading with nothing under it says nothing: put the whole write-up back as it was written.
  if (sections.length === 0 || sections.some((section) => section.lines.length === 0)) {
    return { intro: description.trim(), sections: [] }
  }

  return {
    intro: intro.map((block) => block.join('\n')).join('\n\n'),
    sections: sections.map(({ heading, lines }) => ({
      heading,
      items: lines.map((line) => line.replace(BULLET, '').replace(NUMBER, '').trim()),
      ordered: lines.length > 1 && lines.every((line) => NUMBER.test(line)),
    })),
  }
}
