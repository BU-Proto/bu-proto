// Turns a portal email (plain text, written by an admin) into the HTML and text each recipient
// gets. The layout is tables and inline styles on a light background: the only thing that
// renders the same in Gmail, Outlook and Apple Mail.

/** One person an email goes to. Members have an unsubscribe token; RSVPs and fund sign-ups don't. */
export interface Recipient {
  email: string
  name: string
  unsubscribeToken?: string
}

/** Why someone is getting the email; it's said in the footer. */
export type EmailReason = { kind: 'member' } | { kind: 'event'; title: string } | { kind: 'fund' } | { kind: 'test' }

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

function fillName(value: string, name: string): string {
  return value.replace(/\{\{\s*name\s*\}\}/gi, firstName(name))
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
      return `You're getting this because you RSVP'd to ${reason.title}.`
    case 'fund':
      return "You're getting this because you joined the BU Proto fund interest list."
    case 'test':
      return 'This is a test copy sent from the BU Proto portal.'
  }
}

/** The email one recipient gets: `{{name}}` filled in, the footer for `reason`, and for members an unsubscribe link. */
export function renderEmail(input: {
  subject: string
  body: string
  recipient: Recipient
  reason: EmailReason
  origin: string
}): RenderedEmail {
  const { recipient, reason, origin } = input
  const subject = fillName(input.subject, recipient.name)
  const body = fillName(input.body, recipient.name)
  const unsubscribe = recipient.unsubscribeToken ? unsubscribeUrl(origin, recipient.unsubscribeToken) : null
  const why = reasonText(reason)

  const text = [
    body.replace(/\r\n?/g, '\n').trim(),
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
${bodyHtml(body)}
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
