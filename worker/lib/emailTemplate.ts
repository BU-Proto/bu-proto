// Turns a portal email (plain text, written by an admin) into the HTML and text each recipient
// gets. The layout is nested tables with inline styles, the only thing Gmail, Outlook and Apple
// Mail all render the same. The header, event card and footer carry the site's ASCII field as real
// text (see emailArt.ts), so nothing hangs on images loading. The <style> block only adds things a
// client may drop without harm: the phone layout and dark mode.

import { EMAIL_VARIABLES } from '../../shared/api'
import { artGround, artHtmlRows, artTextRows, rampRule, type ArtOptions } from './emailArt'

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

export interface RenderedEmail {
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

const NAVY = '#061a2e'
const MINT = '#9df0a8'
const INK = '#14212e'
const INK_SOFT = '#4a5a6a'
const MUTED = '#6b7a89'
const LINK = '#0a6aa1'
const PAGE = '#eef2f6'
const RULE = '#e2e8ef'
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace"

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
    html += `<a href="${escapeHtml(url)}" class="pe-link" style="color:${LINK};text-decoration:underline">${escapeHtml(url)}</a>`
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
 * A button sized to its label. The colour sits on the cell, so Word's renderer, which ignores
 * padding on links, still draws it with mso-padding-alt.
 */
function button(url: string, label: string, tone: 'dark' | 'light'): string {
  const bg = tone === 'dark' ? NAVY : '#ffffff'
  const fg = tone === 'dark' ? '#ffffff' : NAVY
  const cls = tone === 'dark' ? ' class="pe-btn"' : ''
  const linkCls = tone === 'dark' ? ' class="pe-btn-a"' : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
<tr><td${cls} align="center" bgcolor="${bg}" style="border-radius:6px;background-color:${bg};mso-padding-alt:12px 20px">
<a${linkCls} href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:12px 20px;border-radius:6px;font-family:${FONT};font-size:15px;font-weight:500;line-height:20px;color:${fg};text-decoration:none;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(label)}</a>
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
}

/** A first paragraph that reads as a title: one short line with no link. */
function isHeadline(paragraph: string): boolean {
  return !paragraph.includes('\n') && paragraph.length <= 72 && !/https?:\/\//.test(paragraph)
}

/**
 * Blank lines split paragraphs; single newlines become <br>. A paragraph that's only a URL becomes
 * a button. A short first line ("Welcome to BU Proto, Ada") becomes the email's headline, set
 * large and tight like the site's headings.
 */
function bodyHtml(body: string): string {
  return paragraphs(body)
    .map((paragraph, index) => {
      if (LONE_URL.test(paragraph)) {
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 26px 0"><tr><td>${button(paragraph, buttonLabel(paragraph), 'dark')}</td></tr></table>`
      }
      const html = paragraph.split('\n').map(linkify).join('<br>')
      if (index === 0 && isHeadline(paragraph)) {
        return `<h1 class="pe-ink pe-head1" style="margin:0 0 22px 0;font-family:${FONT};font-size:34px;font-weight:400;line-height:40px;letter-spacing:-1px;color:${NAVY};mso-line-height-rule:exactly">${html}</h1>`
      }
      return `<p class="pe-ink" style="${P_STYLE}">${html}</p>`
    })
    .join('\n')
}

/** The first line of the message, for the inbox's preview text. */
function preheaderText(body: string): string {
  const line = body.split('\n').find((value) => value.trim()) ?? ''
  const text = line.trim().replace(/\s+/g, ' ')
  return text.length > 140 ? `${text.slice(0, 139)}…` : text
}

// ---- ASCII art ----------------------------------------------------------------------------------

/** Each kind of email gets its own field, the same every time. */
const ART_SEED: Record<EmailReason['kind'], number> = { member: 1, event: 2, fund: 3, test: 4, admin: 5, board: 6 }

// Wide enough to fill the 600px card at 9px (a 0.6em cell is 5.4px); phones crop the right side.
const ART_COLS = 110

/**
 * A block of art in a fixed-layout table, so its long rows can't widen the card: the cell clips
 * them on phones. A <pre> keeps the spaces in every client, Outlook's Word renderer included.
 */
function artBlock(art: ArtOptions, padding: string, heading = ''): string {
  const ground = artGround(art.band ?? [0.3, 0.75])
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${NAVY}" style="width:100%;table-layout:fixed;background-color:${NAVY}">
<tr><td bgcolor="${NAVY}" style="padding:${padding};background-color:${NAVY};background-image:${ground};overflow:hidden">
${heading}<div style="width:100%;overflow:hidden">
<pre aria-hidden="true" style="margin:0;padding:0;font-family:${MONO};font-size:9px;line-height:10px;mso-line-height-rule:exactly;letter-spacing:0;font-variant-ligatures:none;font-feature-settings:'liga' 0, 'calt' 0;white-space:pre;word-wrap:normal;overflow:hidden;color:#9fc3dc">${artHtmlRows(art).join('\n')}</pre>
</div>
</td></tr>
</table>`
}

/**
 * The header: the Proto wordmark in the site's own type, set over the field the way the hero sets
 * its headline, with the field's glyphs running under it and thinning out at the top.
 */
function headerArt(kind: EmailReason['kind']): string {
  const wordmark = `<div style="padding:30px 44px 18px 44px;font-family:${FONT};font-size:40px;font-weight:300;line-height:44px;letter-spacing:-1.2px;color:#ffffff;mso-line-height-rule:exactly">Proto<span style="color:${MINT}">_</span></div>`
  return artBlock({ cols: ART_COLS, rows: 8, seed: ART_SEED[kind], band: [0.25, 0.65], fadeTop: true }, '0 0 12px 4px', wordmark)
}

/** The plain-text header: a narrow strip of the field with the wordmark set into its middle row. */
function textHeader(kind: EmailReason['kind']): string[] {
  const rows = artTextRows({ cols: 56, rows: 3, seed: ART_SEED[kind] }).map((row) => row.padEnd(56))
  rows[1] = `${rows[1].slice(0, 3)}  Proto_  ${rows[1].slice(12)}`
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

function eventHtml(event: EventDetails, origin: string): string {
  const parts = eventDateParts(event.date)
  const date = parts
    ? `<div class="pe-day" style="font-family:${FONT};font-size:60px;font-weight:200;line-height:56px;letter-spacing:-3px;color:#ffffff;mso-line-height-rule:exactly">${parts.day}</div>
<div style="padding-top:10px;font-family:${FONT};font-size:14px;line-height:19px;color:#c9d6e2">${parts.month}<br><span style="color:${MINT}">${parts.weekday}</span></div>`
    : `<div style="font-family:${FONT};font-size:15px;line-height:22px;color:#c9d6e2">${escapeHtml(event.date)}</div>`
  const meta = [event.time, event.place].filter((value) => value.trim()).map(escapeHtml)
  const texture = { cols: ART_COLS, rows: 4, seed: 40, band: [0.4, 0.6] as [number, number] }
  return `<tr><td class="pe-px" style="padding:6px 48px 10px 48px">
<table role="presentation" class="pe-eventbox" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${NAVY}" style="width:100%;table-layout:fixed;border-collapse:separate;border-radius:14px;background-color:${NAVY};overflow:hidden">
<tr><td style="border-radius:14px 14px 0 0;overflow:hidden">${artBlock(texture, '8px 0 8px 0')}</td></tr>
<tr><td class="pe-event" bgcolor="${NAVY}" style="padding:16px 28px 30px 28px;background-color:${NAVY};border-radius:0 0 14px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="pe-date" width="104" valign="top" style="width:104px;padding:4px 20px 0 0">
${date}
</td>
<td class="pe-copy" valign="top" style="word-break:break-word">
<div style="font-family:${FONT};font-size:23px;font-weight:400;line-height:29px;letter-spacing:-0.4px;color:#ffffff">${escapeHtml(event.title)}</div>
${meta.length ? `<div style="padding-top:8px;font-family:${FONT};font-size:15px;line-height:23px;color:#c9d6e2">${meta.join('<br>')}</div>` : ''}
<div style="padding-top:22px">${button(`${origin}/events`, 'See the event', 'light')}</div>
</td>
</tr>
</table>
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
  }
}

const EMPTY_BODY = 'Your message goes here'

// Dark mode for clients that honour it (Apple Mail, Outlook for Mac and iOS, some Android).
// The navy art, event block and footer never change. Clients that invert on their own (Gmail apps,
// Outlook.com) leave the art's colours mostly alone, and the [data-ogsc]/[data-ogsb] rules steer Outlook.com.
const STYLE = `<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
@media screen and (max-width: 620px) {
  .pe-outer { padding: 10px 8px 28px 8px !important; }
  .pe-px { padding-left: 22px !important; padding-right: 22px !important; }
  .pe-body { padding-top: 30px !important; }
  .pe-head1 { font-size: 28px !important; line-height: 34px !important; letter-spacing: -0.6px !important; }
  .pe-event { padding: 14px 20px 26px 20px !important; }
  .pe-date, .pe-copy { display: block !important; width: auto !important; }
  .pe-date { padding: 0 0 18px 0 !important; }
  .pe-footpad { padding-left: 22px !important; padding-right: 22px !important; }
  .pe-foot { padding-left: 14px !important; padding-right: 14px !important; }
  .pe-btn-a { padding: 12px 18px !important; font-size: 14px !important; }
}
@media (prefers-color-scheme: dark) {
  .pe-page { background-color: #020c17 !important; }
  .pe-card { background-color: #0b1d30 !important; border-color: #1a3047 !important; }
  .pe-ink { color: #e7eef5 !important; }
  .pe-soft { color: #a9b8c6 !important; }
  .pe-link { color: ${MINT} !important; }
  .pe-btn { background-color: #ffffff !important; }
  .pe-btn-a { color: ${NAVY} !important; }
  .pe-eventbox { border: 1px solid #23405c !important; }
}
[data-ogsb] .pe-page { background-color: #020c17 !important; }
[data-ogsb] .pe-card { background-color: #0b1d30 !important; }
[data-ogsc] .pe-ink { color: #e7eef5 !important; }
[data-ogsc] .pe-soft { color: #a9b8c6 !important; }
[data-ogsc] .pe-link { color: ${MINT} !important; }
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
  const contentHtml = body
    ? bodyHtml(body)
    : `<p class="pe-soft" style="${P_STYLE};color:${MUTED};font-style:italic">${EMPTY_BODY}</p>`
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
    ? `<br><a href="${escapeHtml(unsubscribe)}" class="pe-soft" style="color:${INK_SOFT};text-decoration:underline">Unsubscribe</a>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<!--<![endif]-->
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>td, div, p, a, h1 { font-family: Arial, sans-serif !important; } pre { font-family: 'Courier New', monospace !important; }</style>
<![endif]-->
${STYLE}
</head>
<body class="pe-page" style="margin:0;padding:0;width:100%;background-color:${PAGE};word-spacing:normal">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE}">${preheader}${filler}</div>
<table role="presentation" class="pe-page" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="width:100%;background-color:${PAGE}">
<tr><td class="pe-outer" align="center" style="padding:32px 16px 40px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="pe-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;table-layout:fixed;border-collapse:separate;background-color:#ffffff;border:1px solid ${RULE};border-radius:18px;overflow:hidden">
<tr><td bgcolor="${NAVY}" style="padding:0;background-color:${NAVY};border-radius:17px 17px 0 0;overflow:hidden">
${headerArt(reason.kind)}
</td></tr>
<tr><td class="pe-px pe-body" style="padding:44px 48px 12px 48px;word-break:break-word;overflow-wrap:anywhere">
${contentHtml}
</td></tr>
${event ? eventHtml(event, origin) : ''}
<tr><td style="padding:28px 0 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td class="pe-px" bgcolor="${NAVY}" style="padding:0 48px;background-color:${NAVY}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #23415c;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td class="pe-footpad" bgcolor="${NAVY}" style="padding:22px 48px 34px 48px;background-color:${NAVY};border-radius:0 0 17px 17px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-family:${FONT};font-size:22px;font-weight:300;line-height:28px;letter-spacing:-0.6px;color:#ffffff">Proto<span style="color:${MINT}">_</span></td></tr>
<tr><td style="padding-top:6px;font-family:${FONT};font-size:14px;line-height:21px;color:#c9d6e2">For anyone at BU who makes things. Hack nights, hackathon trips and demo nights, all year.</td></tr>
<tr><td style="padding-top:14px;font-family:${FONT};font-size:14px;line-height:21px"><a href="${escapeHtml(origin)}" target="_blank" style="color:#ffffff;text-decoration:underline">${escapeHtml(site)}</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="${escapeHtml(origin)}/events" target="_blank" style="color:#ffffff;text-decoration:underline">Events</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="${escapeHtml(origin)}/resources/playbook" target="_blank" style="color:#ffffff;text-decoration:underline">Playbook</a></td></tr>
</table>
</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
<tr><td class="pe-soft pe-foot" style="padding:20px 28px 0 28px;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};word-break:break-word">
${escapeHtml(why)}${footerLink}
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
