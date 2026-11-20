// Resend signs its webhooks the way Svix does: an HMAC-SHA256 of "<svix-id>.<svix-timestamp>.<raw
// body>" keyed with the secret (the base64 after "whsec_"), sent in svix-signature as one or more
// "v1,<base64>" separated by spaces. A request older or newer than five minutes is refused, so a
// captured one can't be replayed later. Checked with Web Crypto: no library needed in a Worker.

const TOLERANCE_SECONDS = 5 * 60

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Compares two strings in time that doesn't depend on where they differ. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return difference === 0
}

export interface SignatureHeaders {
  id: string | undefined
  timestamp: string | undefined
  signature: string | undefined
}

/**
 * Whether a webhook really came from Resend: the body is the raw text as received (parsing and
 * re-stringifying it changes the bytes). `now` is for tests.
 */
export async function verifyWebhook(secret: string, body: string, headers: SignatureHeaders, now = Date.now()): Promise<boolean> {
  const { id, timestamp, signature } = headers
  if (!secret || !id || !timestamp || !signature) return false
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > TOLERANCE_SECONDS) return false

  let key: CryptoKey
  try {
    key = await crypto.subtle.importKey('raw', base64ToBytes(secret.replace(/^whsec_/, '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  } catch {
    return false
  }
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))
  const expected = bytesToBase64(new Uint8Array(signed))
  return signature
    .split(' ')
    .map((part) => part.split(','))
    .some(([version, value]) => version === 'v1' && value !== undefined && sameText(value, expected))
}
