// Small pure helpers the inbox uses to put an email on the right conversation. Kept apart from
// lib/inbox.ts (and its imports) so `npm test` can check them directly.

/** A thread's id and token from one of its reply addresses, or null. */
export function parseReplyAddress(address: string): { id: number; token: string } | null {
  const match = /^reply-(\d+)-([a-z0-9]+)@/i.exec(address.trim())
  return match ? { id: Number(match[1]), token: match[2].toLowerCase() } : null
}

/** "Re: Fwd: Room for hack night" → "room for hack night", to match a reply to its thread. */
export function normalizeSubject(subject: string): string {
  let rest = subject.trim()
  for (;;) {
    const next = rest.replace(/^(re|fw|fwd|aw|sv|antw)\s*(\[\d+\])?\s*:\s*/i, '')
    if (next === rest) break
    rest = next
  }
  return rest.replace(/\s+/g, ' ').toLowerCase()
}

/** "Dana Lee <dana@bu.edu>" → { name: 'Dana Lee', email: 'dana@bu.edu' }; a bare address has no name. */
export function parseAddress(raw: string): { name: string; email: string } {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(raw)
  if (match) return { name: match[1].trim(), email: match[2].trim().toLowerCase() }
  return { name: '', email: raw.trim().toLowerCase() }
}

/** Message-IDs in a References or In-Reply-To header. */
export function messageIds(header: string): string[] {
  return header.match(/<[^<>\s]+>/g) ?? []
}
