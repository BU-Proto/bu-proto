import type { WinInput } from '../../../shared/api'
import { USER_AGENT, absoluteUrl, cleanText, decodeEntities } from './common'

// Devpost project pages ("software") and profiles, read as HTML. Devpost has no public API for
// these, so the parser leans on the ids and classes the page has carried for years (app-title,
// app-details-left, built-with, app-team, submissions) and falls back to empty, not to guesses.

const ORIGIN = 'https://devpost.com'
/** Paths on devpost.com that look like a username but aren't one. */
const NOT_PROFILES = new Set(['software', 'hackathons', 'settings', 'portfolio', 'users', 'api', 'help', 'about', 'contact', 'search'])

export type DevpostTarget = { kind: 'profile' | 'project'; url: string }

/** A devpost.com profile or project URL in its one canonical spelling, or null for anything else. */
export function devpostTarget(input: string): DevpostTarget | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || (url.hostname !== 'devpost.com' && url.hostname !== 'www.devpost.com')) return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length === 2 && parts[0] === 'software' && /^[a-z0-9-]+$/i.test(parts[1]) && parts[1] !== 'built-with') {
    return { kind: 'project', url: `${ORIGIN}/software/${parts[1].toLowerCase()}` }
  }
  if (parts.length === 1 && /^[a-z0-9_.-]+$/i.test(parts[0]) && !NOT_PROFILES.has(parts[0].toLowerCase())) {
    return { kind: 'profile', url: `${ORIGIN}/${parts[0]}` }
  }
  return null
}

/** GET a Devpost page as HTML. Devpost turns away `Accept: text/html` from non-browsers, but not `*\/*`. */
export async function fetchDevpostPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    signal: AbortSignal.timeout(12_000),
    redirect: 'follow',
  })
  if (response.status === 404) throw new Error('Devpost has no page at that address.')
  if (!response.ok) throw new Error(`Devpost answered ${response.status}.`)
  return response.text()
}

// ---- Finding things in the page ----------------------------------------------------------------

/** The whole element whose opening tag starts at `start`, matched by counting its own tag name. */
function outerElement(html: string, start: number): string {
  const name = /^<([a-z][a-z0-9]*)/i.exec(html.slice(start, start + 20))?.[1]
  if (!name) return ''
  const tags = new RegExp(`<(/?)${name}\\b[^>]*?(/?)>`, 'gi')
  tags.lastIndex = start
  let depth = 0
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    if (match[2]) continue
    depth += match[1] ? -1 : 1
    if (depth === 0) return html.slice(start, tags.lastIndex)
  }
  return html.slice(start)
}

/** The element carrying an attribute, e.g. `id="app-team"` or `data-role="software-urls"`, or ''. */
function elementWith(html: string, attribute: string): string {
  const at = html.indexOf(attribute)
  if (at < 0) return ''
  const start = html.lastIndexOf('<', at)
  return start < 0 ? '' : outerElement(html, start)
}

/** What's between an element's opening and closing tags. */
const inner = (element: string) => element.replace(/^<[^>]*>/, '').replace(/<\/[a-z0-9]+>\s*$/i, '')

/**
 * One line of text from a bit of markup: entities decoded, whitespace collapsed. Breaks and block
 * tags become spaces; inline tags just go, so "<b>Events</b>: …" doesn't read "Events : …".
 */
const textOf = (markup: string) =>
  cleanText(decodeEntities(markup.replace(/<br\s*\/?>|<\/?(p|div|li|h[1-6]|t[dhr]|ul|ol)\b[^>]*>/gi, ' ').replace(/<[^>]*>/g, '')))

const attr = (tag: string, name: string) => {
  const value = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag)
  return value ? decodeEntities(value[1] ?? value[2]) : null
}

/** Every opening tag of a kind, e.g. all the `<a …>` in a fragment. */
const openTags = (markup: string, name: string) => markup.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? []

// ---- The write-up as plain text ------------------------------------------------------------------

/** Mark a list item's or a table row's line until the text is rebuilt; never in real text. */
const ITEM = '\u0000'
const ROW = '\u0001'

/**
 * Markup → plain text the site's Prose renders: blocks (headings, paragraphs, lists, tables)
 * separated by blank lines, list items as "- " lines kept together, a table row per line.
 */
export function htmlToText(markup: string): string {
  let flat = markup
    .replace(/<(script|style|iframe|noscript|svg)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (_, row: string) => {
      const cells = [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textOf(cell[1]))
      return `\n${ROW}${cells.join(' | ')}\n`
    })
  // Innermost list items first, each to one marked line; a nested list's items follow its parent's.
  const item = /<li\b[^>]*>((?:(?!<li\b)[\s\S])*?)<\/li>/gi
  while (item.test(flat)) {
    item.lastIndex = 0
    flat = flat.replace(item, (_, body: string) => `\n${body.split(ITEM).map((part) => ITEM + textOf(part)).join('\n')}\n`)
  }
  flat = flat
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|ul|ol|table|thead|tbody|blockquote|pre|hr|figure|section)\b[^>]*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
  const blocks: string[] = []
  let lines: string[] = []
  // What the open block is made of: paragraph text, list items or table rows.
  let kind: 'text' | typeof ITEM | typeof ROW = 'text'
  const flush = () => {
    if (lines.length) blocks.push(lines.join('\n'))
    lines = []
  }
  for (const raw of decodeEntities(flat).split('\n')) {
    const line = raw.replace(/[ \t\u00a0]+/g, ' ').trim()
    const marker = line[0] === ITEM || line[0] === ROW ? line[0] : 'text'
    if (!line) {
      // Blank lines end a paragraph; inside a list or table they're only the gaps between lines.
      if (kind === 'text') flush()
      continue
    }
    if (marker !== kind) flush()
    kind = marker
    const rest = marker === 'text' ? line : line.slice(1).trim()
    if (rest && rest !== '|') lines.push(marker === ITEM ? `- ${rest}` : rest)
  }
  flush()
  return blocks.join('\n\n')
}

/** Cut to `max` characters at a paragraph, sentence or word boundary, with an ellipsis. */
export function clamp(value: string, max: number): string {
  const text = value.trim()
  if (text.length <= max) return text
  const room = text.slice(0, max - 1)
  // The latest paragraph break, sentence end or space past 60% of the room; else a hard cut.
  const floor = max * 0.6
  const cut = [room.lastIndexOf('\n\n'), room.lastIndexOf('. ') + 1, room.lastIndexOf(' ')].find((index) => index > floor)
  return `${room.slice(0, cut ?? room.length).trimEnd()}…`
}

const NEXT_HEADING = /^what[’'`]?s\s+next\b/i

/** The write-up split in two: everything else, and the "What's next…" section's body. */
function splitWriteUp(markup: string): { description: string; nextSteps: string } {
  const headings = [...markup.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
  const at = headings.findIndex((match) => NEXT_HEADING.test(textOf(match[2])))
  if (at < 0) return { description: htmlToText(markup), nextSteps: '' }
  const heading = headings[at]
  const level = Number(heading[1])
  const start = heading.index
  const bodyStart = start + heading[0].length
  // The section runs to the next heading at its level or above ("Explore Nemo" comes after it).
  const end = headings.slice(at + 1).find((match) => Number(match[1]) <= level)?.index ?? markup.length
  return {
    description: htmlToText(markup.slice(0, start) + markup.slice(end)),
    nextSteps: htmlToText(markup.slice(bodyStart, end)),
  }
}

// ---- The project ---------------------------------------------------------------------------------

export interface DevpostSubmission {
  hackathon: string
  url: string
  /** Prize names it won there; empty when it was only submitted. */
  prizes: string[]
}

export interface DevpostProject {
  url: string
  title: string
  tagline: string
  description: string
  nextSteps: string
  stack: string[]
  team: { name: string; href: string }[]
  links: string[]
  /** Full-size gallery images, in gallery order. */
  images: string[]
  /** A small version of the first image (or the project thumbnail), for lists. */
  thumbnail: string | null
  submissions: DevpostSubmission[]
}

function parseSubmissions(html: string): DevpostSubmission[] {
  const section = elementWith(html, 'id="submissions"')
  if (!section) return []
  return section
    .split(/<div class="software-list-content"/i)
    .slice(1)
    .map((chunk) => {
      const link = /<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(chunk)
      const prizes = [...chunk.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .filter((match) => /class="[^"]*\bwinner\b/i.test(match[1]))
        .map((match) => textOf(match[1].replace(/<span\b[^>]*\bwinner\b[^>]*>[\s\S]*?<\/span>/i, '')))
        .filter(Boolean)
      return { hackathon: link ? textOf(link[1]) : '', url: (link && absoluteUrl(attr(link[0], 'href'))) || '', prizes }
    })
    .filter((submission) => submission.hackathon)
}

function parseTeam(html: string): DevpostProject['team'] {
  const section = elementWith(html, 'id="app-team"')
  const people = new Map<string, string>()
  for (const match of section.matchAll(/<a\b[^>]*class="[^"]*\buser-profile-link\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = absoluteUrl(attr(match[0], 'href'), ORIGIN)
    if (!href) continue
    // The avatar link holds an <img alt="Name">, the second link the name as text.
    const name = textOf(match[1]) || cleanText(attr(openTags(match[1], 'img')[0] ?? '', 'alt') ?? '')
    if (!people.has(href) || (!people.get(href) && name)) people.set(href, name)
  }
  return [...people].map(([href, name]) => ({ name: name || href.split('/').pop() || 'Teammate', href }))
}

function parseGallery(html: string): { images: string[]; thumbnail: string | null } {
  const gallery = elementWith(html, 'id="gallery"')
  const images: string[] = []
  let thumbnail: string | null = null
  for (const match of gallery.matchAll(/<a\b[^>]*data-lightbox[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = absoluteUrl(attr(match[0], 'href'))
    if (!href || images.includes(href)) continue
    images.push(href)
    thumbnail ??= absoluteUrl(attr(openTags(match[1], 'img')[0] ?? '', 'src'))
  }
  // Older pages without lightbox links still carry the originals' addresses.
  if (!images.length) {
    for (const match of gallery.matchAll(/https?:\/\/[^"'\s]+\/software_photos\/[^"'\s]+\/original\.(?:png|jpe?g|gif|webp)/gi)) {
      if (!images.includes(match[0])) images.push(match[0])
    }
  }
  const og = /<meta[^>]+property="og:image"[^>]*>/i.exec(html)
  const ogImage = og && absoluteUrl(attr(og[0], 'content'))
  const projectThumb = ogImage && /software_thumbnail_photos/.test(ogImage) ? ogImage : null
  return { images, thumbnail: thumbnail ?? projectThumb ?? images[0] ?? null }
}

/** Everything the import uses from one project page. `url` is the canonical project URL. */
export function parseProjectPage(html: string, url: string): DevpostProject {
  const titleTag = elementWith(html, 'id="app-title"')
  const title = textOf(inner(titleTag)) || textOf(/<title>([^<]*)<\/title>/i.exec(html)?.[1]?.replace(/\|\s*Devpost\s*$/i, '') ?? '')
  // The tagline is the first large paragraph after the title.
  const afterTitle = titleTag ? html.slice(html.indexOf(titleTag) + titleTag.length) : html
  const tagline = /<p class="large"[^>]*>([\s\S]*?)<\/p>/i.exec(afterTitle)
  const left = elementWith(html, 'id="app-details-left"')
  // The write-up is what's left of the left column once the gallery, tags and links are out.
  let writeUp = left
  for (const part of ['id="gallery"', 'id="built-with"', 'data-role="software-urls"', 'class="app-links']) {
    const element = elementWith(writeUp, part)
    if (element) writeUp = writeUp.replace(element, '')
  }
  writeUp = writeUp.replace(/<h2>\s*(Built With|Try it out)\s*<\/h2>/gi, '')
  const { description, nextSteps } = splitWriteUp(inner(writeUp))

  const stack: string[] = []
  for (const match of elementWith(html, 'id="built-with"').matchAll(/<span class="cp-tag[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)) {
    const tag = textOf(match[1])
    if (tag && !stack.some((seen) => seen.toLowerCase() === tag.toLowerCase())) stack.push(tag)
  }

  const links: string[] = []
  for (const tag of openTags(elementWith(html, 'data-role="software-urls"'), 'a')) {
    const href = absoluteUrl(attr(tag, 'href'))
    if (!href || links.includes(href)) continue
    // The hackathon's own Devpost page isn't the project's link.
    if (/(^|\.)devpost\.com$/i.test(new URL(href).hostname)) continue
    links.push(href)
  }

  return {
    url,
    title,
    tagline: tagline ? textOf(tagline[1]) : '',
    description,
    nextSteps,
    stack,
    team: parseTeam(html),
    links,
    ...parseGallery(html),
    submissions: parseSubmissions(html),
  }
}

/** The submission the win is about: the first that won something, else the first. */
export function headline(project: DevpostProject): { submission: DevpostSubmission | null; won: boolean } {
  const winner = project.submissions.find((submission) => submission.prizes.length > 0)
  return { submission: winner ?? project.submissions[0] ?? null, won: Boolean(winner) }
}

/** A profile link as compared for BU marks: lower case, no www, no trailing slash. */
export const profileKey = (href: string) => href.trim().toLowerCase().replace('://www.', '://').replace(/\/+$/, '')

/**
 * A project as an unpublished win draft. Every value is clamped to what winInput accepts.
 * `buProfiles` holds profileKey()s of people already marked BU on some win; they're marked here too.
 */
export function projectToWin(project: DevpostProject, buProfiles: ReadonlySet<string> = new Set()): WinInput {
  const { submission } = headline(project)
  const [prize, ...more] = submission?.prizes ?? []
  const github = project.links.find((link) => /^(www\.)?github\.com$/i.test(new URL(link).hostname)) ?? ''
  return {
    project: clamp(project.title || 'Untitled project', 80),
    blurb: clamp(project.tagline, 300),
    // A project that went to no hackathon still needs one named; the admin fixes it in review.
    event: clamp(submission?.hackathon || 'Hackathon not listed', 80),
    placement: clamp(prize ?? (submission ? 'Submitted' : 'Not submitted'), 60),
    track: clamp(more.join(', '), 80),
    team: project.team
      .slice(0, 12)
      .map((person) => ({ name: clamp(person.name, 80), href: person.href, bu: buProfiles.has(profileKey(person.href)) })),
    photo: project.images[0] ?? '',
    gallery: project.images.slice(1, 25),
    description: clamp(project.description, 8000),
    stack: project.stack.map((tag) => clamp(tag, 40)).slice(0, 24),
    github,
    devpost: project.url,
    funding: '',
    nextSteps: clamp(project.nextSteps, 4000),
    position: 0,
    placeholder: false,
    published: false,
  }
}

// ---- Profiles ------------------------------------------------------------------------------------

/** Project URLs a profile page links, in page order, and its next page if it has one. */
export function parseProfilePage(html: string): { projects: string[]; next: string | null } {
  const projects: string[] = []
  for (const match of html.matchAll(/href="(https:\/\/devpost\.com\/software\/[^"?#]+)"/gi)) {
    const target = devpostTarget(match[1])
    if (target?.kind === 'project' && !projects.includes(target.url)) projects.push(target.url)
  }
  const nextTag = openTags(html, 'a').find((tag) => /\brel="next"/i.test(tag))
  return { projects, next: nextTag ? absoluteUrl(attr(nextTag, 'href'), ORIGIN) : null }
}
