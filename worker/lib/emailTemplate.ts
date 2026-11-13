// Turns a portal email (plain text, written by an admin) into the HTML and text each recipient
// gets. The layout is nested tables with inline styles, the only thing Gmail, Outlook and Apple
// Mail all render the same.
//
// It's built from the site's own pieces: a banner of the field with the seal and name on it,
// then everything else straight on the harbor: the headline, the message, an event as a navy
// slab with its date in the large iris figure, the frost button, mint links. The banner is a
// picture of the site's hero (public/email/hero.jpg), so the colours are the real ones. Where
// pictures are blocked the cell's own colour stands in; every word is text, not part of the
// picture, so nothing is lost.
//
// The email is dark for everyone, as the site is; every colour is set outright on its own cell,
// so it doesn't depend on a client's dark mode. The <style> block only adds the phone layout.

import { EMAIL_VARIABLES } from '../../shared/api'
import { artTextRows, rampRule } from './emailArt'

/** One person an email goes to. Members have an unsubscribe token and a track; RSVPs and fund sign-ups don't. */
export interface Recipient {
  email: string
  name: string
  unsubscribeToken?: string
  track?: string
}

export interface EventDetails {
  title: string
  /** ISO day, yyyy-mm-dd. */
  date: string
  time: string
  place: string
}

/** Why someone is getting the email; it's said in the footer. Event emails also fill the event variables. */
export type EmailReason =
  | { kind: 'member' }
  | { kind: 'event'; event: EventDetails }
  | { kind: 'fund' }
  | { kind: 'test' }
  /** Transactional: someone was added as a portal admin. No list, so no unsubscribe. */
  | { kind: 'admin' }
  /** Transactional: someone put themselves forward for a board seat (or, to owners, that they did). */
  | { kind: 'board' }
  /** Transactional: someone applied for a role (or, to owners, that they did). */
  | { kind: 'role' }

export interface RenderedEmail {
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

// The site's palette (src/index.css), as the solid colours email needs. Where the site lays frost
// over a ground at some strength, the mix is worked out here.
const HARBOR = '#061a2e'
const NAVY = '#0b2a46'
const FROST = '#f6fbff'
const MINT = '#9df0a8'
const IRIS = '#ab9dff'
/** Body copy: the palette's paper, a touch softer than frost over a long read. */
const INK = '#e3eaf0'
/** Frost at the site's "soft" and "dim" strengths, on the harbor. */
const INK_SOFT = '#c1cad1'
const MUTED = '#919ca7'
const LINK = MINT
/** The slab's lit edge on the harbor: a card's border, and the rule above the footer. */
const EDGE = '#253749'
/** The same edge where it sits on navy. */
const EDGE_ON_NAVY = '#2a455e'
/** The field's blue-violet under the banner's corner, shown in its place where pictures are blocked. */
const FIELD = '#786c9f'
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
/** What the site puts under copy that sits on the field, so it holds against the light behind it. */
const ON_FIELD = 'text-shadow:0 1px 2px rgba(6,26,46,0.5),0 0 18px rgba(6,26,46,0.35)'

/** The email's pictures, served by the site itself from public/email. */
const heroImage = (origin: string) => `${origin}/email/hero.jpg`
const sealImage = (origin: string) => `${origin}/email/seal.png`

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there'
}

/** "Thu, Nov 12" from an ISO day. UTC, so the day never shifts with the Worker's clock. */
export function formatEventDate(day: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return day
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// ---- Variables ----------------------------------------------------------------------------------

/** Variable name (lowercased, so {{fullname}} works too) → its token as listed in EMAIL_VARIABLES. */
const KNOWN_VARIABLES = new Map(EMAIL_VARIABLES.map((variable) => [variable.token.slice(2, -2).toLowerCase(), variable.token]))
const VARIABLE_PATTERN = /\{\{\s*([a-z]\w*)\s*\}\}/gi

/** Values keyed by token, e.g. { '{{name}}': 'Ada' }. */
export type VariableValues = Partial<Record<string, string>>

/** The EMAIL_VARIABLES tokens a subject or body uses, each once. */
export function usedVariables(...values: string[]): string[] {
  const used = new Set<string>()
  for (const value of values) {
    for (const match of value.matchAll(VARIABLE_PATTERN)) {
      const token = KNOWN_VARIABLES.get(match[1].toLowerCase())
      if (token) used.add(token)
    }
  }
  return [...used]
}

function variableValues(recipient: Recipient, reason: EmailReason): VariableValues {
  const event = reason.kind === 'event' ? reason.event : null
  return {
    '{{name}}': firstName(recipient.name),
    '{{fullName}}': recipient.name.trim(),
    '{{email}}': recipient.email,
    '{{track}}': recipient.track,
    '{{event}}': event?.title,
    '{{eventDate}}': event ? formatEventDate(event.date) : undefined,
    '{{eventTime}}': event?.time,
    '{{eventPlace}}': event?.place,
  }
}

/** Known variables become their value (empty when there's none); anything else in braces stays as typed. */
function fillVariables(value: string, values: VariableValues): string {
  return value.replace(VARIABLE_PATTERN, (match, name: string) => {
    const token = KNOWN_VARIABLES.get(name.toLowerCase())
    return token ? (values[token] ?? '') : match
  })
}

export function unsubscribeUrl(origin: string, token: string): string {
  return `${origin}/api/unsubscribe?token=${encodeURIComponent(token)}`
}

// ---- Body ---------------------------------------------------------------------------------------

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g
const LONE_URL = /^https?:\/\/[^\s<>"']+$/

/** Escape a line of plain text and turn bare URLs into links. */
function linkify(line: string): string {
  let html = ''
  let last = 0
  for (const match of line.matchAll(URL_PATTERN)) {
    let url = match[0]
    // Punctuation that ends a sentence isn't part of the link, nor is a ")" the URL didn't open.
    while (/[.,;:!?)\]]$/.test(url) && !(url.endsWith(')') && count(url, '(') >= count(url, ')'))) url = url.slice(0, -1)
    const start = match.index
    html += escapeHtml(line.slice(last, start))
    html += `<a href="${escapeHtml(url)}" style="color:${LINK};text-decoration:underline">${escapeHtml(url)}</a>`
    last = start + url.length
  }
  return html + escapeHtml(line.slice(last))
}

function count(value: string, char: string): number {
  return value.split(char).length - 1
}

/** "proto.bu.edu/events" for a button: the host and path, without the scheme, www or a trailing slash. */
function buttonLabel(url: string): string {
  let label = url
  try {
    const parsed = new URL(url)
    label = `${parsed.host.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')}`
  } catch {
    label = url.replace(/^https?:\/\//, '')
  }
  return label.length > 38 ? `${label.slice(0, 37)}…` : label
}


/**
 * The site's frost button: a full round, sized to its label. The colour sits on the cell, so
 * Word's renderer, which ignores padding on links, still draws it with mso-padding-alt.
 */
function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
<tr><td align="center" bgcolor="${FROST}" style="border-radius:999px;background-color:${FROST};mso-padding-alt:12px 22px">
<a class="pe-btn-a" href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:12px 22px;border-radius:999px;font-family:${FONT};font-size:14px;font-weight:500;line-height:20px;color:${NAVY};text-decoration:none;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(label)}</a>
</td></tr>
</table>`
}

const P_STYLE = `margin:0 0 20px 0;font-family:${FONT};font-size:16px;line-height:27px;color:${INK}`

/** The message as paragraphs: split on blank lines, single newlines become <br>. */
function paragraphs(body: string): string[] {
  return body
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/** A first paragraph that reads as a title: one short line with no link. */
function isHeadline(paragraph: string): boolean {
  return !paragraph.includes('\n') && paragraph.length <= 72 && !/https?:\/\//.test(paragraph)
}

/**
 * The message in two parts. A short first line ("Welcome to BU Proto, Ada") is the email's
 * headline, which goes up on the field the way the site's page titles do; the rest is the copy.
 */
function splitBody(body: string): { headline: string | null; rest: string[] } {
  const all = paragraphs(body)
  return all.length > 0 && isHeadline(all[0]) ? { headline: all[0], rest: all.slice(1) } : { headline: null, rest: all }
}

/** Paragraphs as HTML. Single newlines become <br>, and a paragraph that's only a URL becomes a button. */
function copyHtml(rest: string[]): string {
  return rest
    .map((paragraph) => {
      if (LONE_URL.test(paragraph)) {
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 26px 0"><tr><td>${button(paragraph, buttonLabel(paragraph))}</td></tr></table>`
      }
      return `<p style="${P_STYLE}">${paragraph.split('\n').map(linkify).join('<br>')}</p>`
    })
    .join('\n')
}

/** The first line of the message, for the inbox's preview text. */
function preheaderText(body: string): string {
  const line = body.split('\n').find((value) => value.trim()) ?? ''
  const text = line.trim().replace(/\s+/g, ' ')
  return text.length > 140 ? `${text.slice(0, 139)}…` : text
}

// ---- Hero --------------------------------------------------------------------------------------

/** Each kind of email gets its own strip of glyphs in the plain-text version, the same every time. */
const ART_SEED: Record<EmailReason['kind'], number> = { member: 1, event: 2, fund: 3, test: 4, admin: 5, board: 6, role: 7 }

/** The seal and the name, as the site's top bar and footer set them. */
function brand(origin: string, name: string, size: number, style: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding-right:${Math.round(size / 3)}px;font-size:0;line-height:0"><img src="${escapeHtml(sealImage(origin))}" width="${size}" height="${size}" alt="" style="display:block;border:0;outline:none;width:${size}px;height:${size}px"></td>
<td valign="middle" style="font-family:${FONT};${style}">${name}</td>
</tr></table>`
}

/**
 * The banner: a strip of the site's field, the currents and their glyphs down to the first of
 * the blue under them, with the seal and name in its corner. Its top corners are rounded and its
 * foot is square. The headline and the message start under it, on the harbor, not on the picture.
 *
 * The picture is the cell's background (600 by 230 here). The spacer under the name is sized as
 * a share of the column's width, so the cell keeps the picture's proportions on a phone, and
 * `cover` trims whatever small difference is left. Classic Outlook shows no cell backgrounds, so
 * it skips the spacer and gets a plain band in the field's colour with the name in it.
 */
function bannerHtml(origin: string): string {
  const image = escapeHtml(heroImage(origin))
  return `<tr><td class="pe-hero" background="${image}" bgcolor="${FIELD}" valign="top" style="padding:26px 40px 0 40px;border-radius:22px 22px 0 0;background-color:${FIELD};background-image:url('${image}');background-repeat:no-repeat;background-position:center center;background-size:cover">
${brand(origin, 'Proto', 24, `font-size:16px;font-weight:500;line-height:24px;letter-spacing:-0.1px;color:#ffffff;${ON_FIELD}`)}
<!--[if !mso]><!--><div class="pe-gap" style="height:0;line-height:0;font-size:0;padding-bottom:34.6%"></div><!--<![endif]-->
<!--[if mso]><div style="height:22px;line-height:22px;font-size:1px">&nbsp;</div><![endif]-->
</td></tr>`
}

/** The headline, when the message opens with one: large and light on the harbor, like the site's page titles. */
function headlineHtml(headline: string): string {
  return `<h1 class="pe-head1" style="margin:0 0 18px 0;font-family:${FONT};font-size:34px;font-weight:300;line-height:40px;letter-spacing:-1px;color:${FROST};mso-line-height-rule:exactly">${linkify(headline)}</h1>`
}

/** The plain-text header: a narrow strip of the field with the name set into its middle row. */
function textHeader(kind: EmailReason['kind']): string[] {
  const rows = artTextRows({ cols: 56, rows: 3, seed: ART_SEED[kind] }).map((row) => row.padEnd(56))
  rows[1] = `${rows[1].slice(0, 3)}  BU Proto  ${rows[1].slice(15)}`
  return rows.map((row) => row.trimEnd())
}

// ---- Event block --------------------------------------------------------------------------------

/** The pieces of the big date in the event block: 12, November, Thursday. Null for a day that doesn't parse. */
function eventDateParts(day: string): { day: number; month: string; weekday: string } | null {
  const date = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  const part = (options: Intl.DateTimeFormatOptions) => date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })
  return { day: date.getUTCDate(), month: part({ month: 'long' }), weekday: part({ weekday: 'long' }) }
}

/**
 * The event, as the site's own event card sets it: the day in the large iris figure with the
 * month and weekday beside it, the title under that, when and where, and the way to its page.
 */
function eventHtml(event: EventDetails, origin: string): string {
  const parts = eventDateParts(event.date)
  const date = parts
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="bottom" style="padding-right:14px;font-family:${FONT};font-size:64px;font-weight:200;line-height:58px;letter-spacing:-3px;color:${IRIS};mso-line-height-rule:exactly">${parts.day}</td>
<td valign="bottom" style="padding-bottom:5px;font-family:${FONT};font-size:14px;line-height:20px;color:${INK_SOFT}">${parts.month}<br>${parts.weekday}</td>
</tr></table>`
    : `<div style="font-family:${FONT};font-size:15px;line-height:22px;color:${INK_SOFT}">${escapeHtml(event.date)}</div>`
  const meta = [event.time, event.place].filter((value) => value.trim()).map(escapeHtml)
  return `<tr><td class="pe-px" style="padding:6px 40px 10px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${NAVY}" style="width:100%;border-collapse:separate;border:1px solid ${EDGE_ON_NAVY};border-radius:22px;background-color:${NAVY}">
<tr><td class="pe-event" style="padding:28px 30px 30px 30px;word-break:break-word">
${date}
<div style="padding-top:20px;font-family:${FONT};font-size:26px;font-weight:300;line-height:32px;letter-spacing:-0.6px;color:${FROST}">${escapeHtml(event.title)}</div>
${meta.length ? `<div style="padding-top:8px;font-family:${FONT};font-size:15px;line-height:23px;color:${INK_SOFT}">${meta.join('<br>')}</div>` : ''}
<div style="padding-top:22px">${button(`${origin}/events`, 'See the event')}</div>
</td></tr>
</table>
</td></tr>`
}

function eventText(event: EventDetails, origin: string): string[] {
  const parts = eventDateParts(event.date)
  return [
    parts ? `${parts.weekday}, ${parts.month} ${parts.day}` : event.date,
    event.title,
    ...[event.time, event.place].filter((value) => value.trim()),
    `See the event: ${origin}/events`,
  ]
}

// ---- Footer -------------------------------------------------------------------------------------

function reasonText(reason: EmailReason): string {
  switch (reason.kind) {
    case 'member':
      return "You're getting this because you're a BU Proto member."
    case 'event':
      // A title that ends in its own punctuation ("Why hackathons?") doesn't get a second stop.
      return `You're getting this because you RSVP'd to ${reason.event.title.trim()}${/[.!?]$/.test(reason.event.title.trim()) ? '' : '.'}`
    case 'fund':
      return "You're getting this because you joined the BU Proto fund interest list."
    case 'test':
      return 'This is a test copy sent from the BU Proto portal.'
    case 'admin':
      return "You're getting this because you were added as an admin of the BU Proto portal."
    case 'board':
      return "You're getting this because of a board seat form sent on buproto.com."
    case 'role':
      return "You're getting this because of an application for a role sent on buproto.com."
  }
}

const EMPTY_BODY = 'Your message goes here'

// The email is dark already, so there's nothing for a client's dark mode to do; saying so keeps
// the ones that listen from re-tinting it. What's left is the phone layout: narrower gutters, the
// banner's spacer re-proportioned for them, and the type a step down.
const STYLE = `<style>
:root { color-scheme: dark; supported-color-schemes: dark; }
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
@media screen and (max-width: 620px) {
  .pe-outer { padding: 12px 12px 32px 12px !important; }
  .pe-hero { padding: 18px 14px 0 14px !important; border-radius: 18px 18px 0 0 !important; }
  .pe-gap { padding-bottom: 29% !important; }
  .pe-body { padding-top: 24px !important; }
  .pe-head1 { font-size: 28px !important; line-height: 34px !important; letter-spacing: -0.7px !important; }
  .pe-px { padding-left: 14px !important; padding-right: 14px !important; }
  .pe-event { padding: 24px 20px 26px 20px !important; }
}
</style>`

/**
 * The email one recipient gets: variables filled in, the footer for `reason`, and for members an
 * unsubscribe link. `values` overrides variables (test sends fill the rest with examples). An empty
 * subject or body, which only the preview allows, renders as a placeholder. Event emails end with
 * the event's details and a link to the events page.
 */
export function renderEmail(input: {
  subject: string
  body: string
  recipient: Recipient
  reason: EmailReason
  origin: string
  values?: VariableValues
}): RenderedEmail {
  const { recipient, reason, origin } = input
  const values = { ...variableValues(recipient, reason), ...input.values }
  const subject = fillVariables(input.subject, values).trim() || '(No subject)'
  const body = fillVariables(input.body, values).replace(/\r\n?/g, '\n').trim()
  const unsubscribe = recipient.unsubscribeToken ? unsubscribeUrl(origin, recipient.unsubscribeToken) : null
  const why = reasonText(reason)
  const event = reason.kind === 'event' ? reason.event : null
  const { headline, rest } = splitBody(body)
  const contentHtml = body
    ? `${headline ? headlineHtml(headline) : ''}${copyHtml(rest)}`
    : `<p style="${P_STYLE};color:${MUTED};font-style:italic">${EMPTY_BODY}</p>`
  const site = origin.replace(/^https?:\/\//, '')

  const text = [
    ...textHeader(reason.kind),
    '',
    body || EMPTY_BODY,
    ...(event ? ['', rampRule(56), '', ...eventText(event, origin)] : []),
    '',
    '--',
    'BU Proto, for anyone at BU who makes things.',
    origin,
    '',
    why,
    ...(unsubscribe ? [`Unsubscribe: ${unsubscribe}`] : []),
  ].join('\n')

  // Zero-width fillers after the preview text, so the inbox doesn't pull in the art's glyphs.
  const preheader = escapeHtml(preheaderText(body))
  const filler = '&#847;&zwnj;&nbsp;'.repeat(60)
  const footerLink = unsubscribe
    ? `<br><a href="${escapeHtml(unsubscribe)}" style="color:${INK_SOFT};text-decoration:underline">Unsubscribe</a>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(subject)}</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&display=swap" rel="stylesheet">
<!--<![endif]-->
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>td, div, p, a, h1 { font-family: Arial, sans-serif !important; }</style>
<![endif]-->
${STYLE}
</head>
<body bgcolor="${HARBOR}" style="margin:0;padding:0;width:100%;background-color:${HARBOR};word-spacing:normal">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${HARBOR}">${preheader}${filler}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${HARBOR}" style="width:100%;background-color:${HARBOR}">
<tr><td class="pe-outer" align="center" style="padding:20px 16px 44px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${HARBOR}" style="width:100%;max-width:600px;table-layout:fixed;border-collapse:separate;background-color:${HARBOR}">
${bannerHtml(origin)}
<tr><td class="pe-px pe-body" style="padding:32px 40px 6px 40px;word-break:break-word;overflow-wrap:anywhere">
${contentHtml}
</td></tr>
${event ? eventHtml(event, origin) : ''}
<tr><td class="pe-px" style="padding:26px 40px 0 40px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${EDGE};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td class="pe-px" style="padding:22px 40px 0 40px">
${brand(origin, 'BU Proto', 20, `font-size:15px;font-weight:500;line-height:20px;color:${FROST}`)}
<div style="padding-top:10px;font-family:${FONT};font-size:14px;line-height:21px;color:${INK_SOFT}">Hack nights, hackathon trips and demo nights for BU students who make things.</div>
<div style="padding-top:12px;font-family:${FONT};font-size:14px;line-height:21px"><a href="${escapeHtml(origin)}" target="_blank" style="color:${FROST};text-decoration:underline">${escapeHtml(site)}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="${escapeHtml(origin)}/events" target="_blank" style="color:${FROST};text-decoration:underline">Events</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="${escapeHtml(origin)}/hackathons" target="_blank" style="color:${FROST};text-decoration:underline">Hackathons</a></div>
<div style="padding-top:22px;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};word-break:break-word">${escapeHtml(why)}${footerLink}</div>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>
`

  const headers = unsubscribe
    ? { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
    : undefined
  return { subject, html, text, headers }
}
