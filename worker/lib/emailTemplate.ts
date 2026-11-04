// Turns a portal email (plain text, written by an admin) into the HTML and text each recipient
// gets. The layout is tables and inline styles on a light background: the only thing that
// renders the same in Gmail, Outlook and Apple Mail.

import { EMAIL_VARIABLES } from '../../shared/api'

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

export interface RenderedEmail {
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

const NAVY = '#061a2e'
const MINT = '#9df0a8'
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

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

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g

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
    html += `<a href="${escapeHtml(url)}" style="color:${NAVY};text-decoration:underline">${escapeHtml(url)}</a>`
    last = start + url.length
  }
  return html + escapeHtml(line.slice(last))
}

function count(value: string, char: string): number {
  return value.split(char).length - 1
}

/** Blank lines split paragraphs; single newlines become <br>. */
function bodyHtml(body: string): string {
  return body
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().split('\n').map(linkify).join('<br>'))
    .map((paragraph) => `<p style="margin:0 0 16px 0">${paragraph}</p>`)
    .join('\n')
}

function reasonText(reason: EmailReason): string {
  switch (reason.kind) {
    case 'member':
      return "You're getting this because you're a BU Proto member."
    case 'event':
      return `You're getting this because you RSVP'd to ${reason.event.title}.`
    case 'fund':
      return "You're getting this because you joined the BU Proto fund interest list."
    case 'test':
      return 'This is a test copy sent from the BU Proto portal.'
  }
}

const EMPTY_BODY = 'Your message goes here'

/**
 * The email one recipient gets: variables filled in, the footer for `reason`, and for members an
 * unsubscribe link. `values` overrides variables (test sends fill the rest with examples). An empty
 * subject or body, which only the preview allows, renders as a placeholder.
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
  const contentHtml = body ? bodyHtml(body) : `<p style="margin:0 0 16px 0;color:#8a97a5;font-style:italic">${EMPTY_BODY}</p>`

  const text = [
    body || EMPTY_BODY,
    '',
    '--',
    why,
    ...(unsubscribe ? [`Unsubscribe: ${unsubscribe}`] : []),
  ].join('\n')

  const footerLink = unsubscribe
    ? `<br><a href="${escapeHtml(unsubscribe)}" style="color:#5b6b7b;text-decoration:underline">Unsubscribe</a>`
    : ''
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f5f7">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #e3e8ee;border-radius:8px">
<tr><td style="padding:28px 32px 0 32px;font-family:${MONO};font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${NAVY}">BU Proto</td></tr>
<tr><td style="padding:14px 32px 0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="3" style="height:3px;line-height:3px;font-size:0;background-color:${MINT}">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:24px 32px 8px 32px;font-family:${FONT};font-size:16px;line-height:1.6;color:#1b2733">
${contentHtml}
</td></tr>
<tr><td style="padding:16px 32px 28px 32px;border-top:1px solid #e3e8ee;font-family:${FONT};font-size:12px;line-height:1.6;color:#5b6b7b">
${escapeHtml(why)}${footerLink}
</td></tr>
</table>
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
