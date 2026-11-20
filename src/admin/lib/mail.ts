import type { MailReading } from '../../../shared/api'

// Plain helpers the Inbox pages share (kept out of the page files so Fast Refresh keeps working).

/** The few words a row or an email needs to say what Claude made of an email that arrived. */
export function readingChips(reading: MailReading | null, isAsk: boolean): { text: string; tone: 'good' | 'warn' | 'quiet' }[] {
  if (!reading) return []
  const chips: { text: string; tone: 'good' | 'warn' | 'quiet' }[] = []
  if (isAsk && reading.answersAsk === 'yes') chips.push({ text: 'Answers our ask', tone: 'good' })
  if (isAsk && reading.answersAsk === 'partly') chips.push({ text: 'Partly answers our ask', tone: 'warn' })
  if (isAsk && reading.answersAsk === 'no') chips.push({ text: 'Doesn’t answer our ask yet', tone: 'warn' })
  if (reading.needsReply) chips.push({ text: 'Needs a reply', tone: 'warn' })
  if (reading.category === 'automated') chips.push({ text: 'Automatic', tone: 'quiet' })
  if (reading.category === 'spam') chips.push({ text: 'Spam', tone: 'quiet' })
  return chips
}

/**
 * An email's own words, and the earlier email it quotes ("On Tue, Dana wrote:", "> ..."), so the
 * quote can fold away the way a mail app folds it.
 */
export function splitQuoted(text: string): { own: string; quoted: string } {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const at = lines.findIndex(
    (line, index) =>
      /^On .{4,200}wrote:\s*$/.test(line.trim()) ||
      /^-{2,}\s*(Original Message|Forwarded message)\s*-{2,}/i.test(line.trim()) ||
      /^From: .+/.test(line.trim()) && index > 0 && lines[index - 1].trim() === '' && /^(Sent|Date): /.test(lines[index + 1]?.trim() ?? '') ||
      (line.startsWith('>') && lines.slice(index).every((rest) => rest.startsWith('>') || rest.trim() === '')),
  )
  if (at <= 0) return { own: text.trim(), quoted: '' }
  return { own: lines.slice(0, at).join('\n').trim(), quoted: lines.slice(at).join('\n').trim() }
}
