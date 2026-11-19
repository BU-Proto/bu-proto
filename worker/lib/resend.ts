// Sending through Resend's batch API with fetch (no SDK). Without RESEND_API_KEY nothing leaves:
// each email is logged to the console instead, which is how local dev works.

const BATCH_URL = 'https://api.resend.com/emails/batch'
/** Resend's limit for one batch request. */
const BATCH_SIZE = 100

export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

export interface SendResult {
  sent: number
  failed: number
  /** No RESEND_API_KEY: the emails were logged, not sent. */
  logged: boolean
}

/**
 * Send every email, 100 per request. Each batch carries `Idempotency-Key: <key>-<n>`, so the one
 * retry after a network error, 429 or 5xx can't deliver a batch twice. A failed batch is counted
 * and the rest still go.
 */
export async function sendEmails(env: Env, emails: OutgoingEmail[], key: string): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    for (const email of emails) console.log(`[email] (not sent, no RESEND_API_KEY) to=${email.to} subject=${email.subject}`)
    return { sent: 0, failed: 0, logged: true }
  }

  const from = String(env.EMAIL_FROM)
  const replyTo = String(env.EMAIL_REPLY_TO).trim()
  let sent = 0
  let failed = 0
  for (let start = 0, batch = 1; start < emails.length; start += BATCH_SIZE, batch++) {
    const chunk = emails.slice(start, start + BATCH_SIZE)
    const payload = chunk.map((email) => ({
      from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(replyTo && { reply_to: replyTo }),
      ...(email.headers && { headers: email.headers }),
    }))
    const accepted = await postBatch(env.RESEND_API_KEY, payload, `${key}-${batch}`)
    sent += accepted
    failed += chunk.length - accepted
  }
  return { sent, failed, logged: false }
}

export interface PersonalEmail {
  /** A display name for the From line ("Andres from Proto"); the address stays EMAIL_FROM's. */
  fromName?: string
  to: string
  cc: string[]
  replyTo: string
  subject: string
  html: string
  text: string
  attachments: { filename: string; content: Uint8Array }[]
}

/** The address inside EMAIL_FROM ("Proto <hello@proto.boston>" → hello@proto.boston). */
function fromAddress(from: string): string {
  return /<([^>]+)>/.exec(from)?.[1] ?? from.trim()
}

/**
 * One email to one person, as an ask sends it: Cc and Reply-To the teammate, files attached.
 * Resend's batch endpoint takes no attachments, so this is its own request. The same
 * Idempotency-Key guards its one retry. 'logged' without RESEND_API_KEY.
 */
export async function sendPersonalEmail(env: Env, email: PersonalEmail, key: string): Promise<'sent' | 'failed' | 'logged'> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email] (not sent, no RESEND_API_KEY) to=${email.to} cc=${email.cc.join(',')} subject=${email.subject} files=${email.attachments.length}`)
    return 'logged'
  }
  const address = fromAddress(String(env.EMAIL_FROM))
  const name = email.fromName?.replace(/["<>\r\n]/g, '').trim()
  const payload = {
    from: name ? `"${name}" <${address}>` : String(env.EMAIL_FROM),
    to: [email.to],
    ...(email.cc.length && { cc: email.cc }),
    reply_to: email.replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(email.attachments.length && {
      attachments: email.attachments.map((file) => ({ filename: file.filename, content: toBase64(file.content) })),
    }),
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify(payload),
      })
      if (response.ok) return 'sent'
      const detail = await response.text().catch(() => '')
      console.error(`[email] Resend ${key} failed: ${response.status} ${detail.slice(0, 500)}`)
      if (response.status !== 429 && response.status < 500) return 'failed'
    } catch (error) {
      console.error(`[email] Resend ${key} failed:`, error)
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return 'failed'
}

/** Bytes as base64, a chunk at a time (spreading megabytes into one call overflows the stack). */
export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

/** How many emails of one batch Resend accepted (0 when the request failed). */
async function postBatch(apiKey: string, payload: unknown[], idempotencyKey: string): Promise<number> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(BATCH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const body = await response.json<{ data?: { id: string }[] }>().catch(() => null)
        return Math.min(body?.data?.length ?? payload.length, payload.length)
      }
      const detail = await response.text().catch(() => '')
      console.error(`[email] Resend batch ${idempotencyKey} failed: ${response.status} ${detail.slice(0, 500)}`)
      // 4xx other than 429 means the request itself is wrong; sending it again won't help.
      if (response.status !== 429 && response.status < 500) return 0
    } catch (error) {
      console.error(`[email] Resend batch ${idempotencyKey} failed:`, error)
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return 0
}
