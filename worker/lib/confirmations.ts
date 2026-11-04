// The emails the public forms send back: a welcome for a new member, a confirmation for an RSVP
// and for the fund list. Each is sent from waitUntil after the form has answered, and never
// throws, so a slow or failing Resend can't hold up or undo a sign-up. The portal previews and
// test-sends them through the same builders, so what it shows is what people get.

import type { AutomaticEmailKey } from '../../shared/api'
import { bostonToday } from './dates'
import { type EventDetails, formatEventDate, renderEmail, type EmailReason, type Recipient, type RenderedEmail } from './emailTemplate'
import { randomToken } from './crypto'
import { sendEmails, type SendResult } from './resend'

/** What each track is for, said back to someone who just picked it. */
const TRACK_LINES: Record<string, string> = {
  Start: 'You picked Start: workshops and first-hackathon squads, so your first weekend isn’t a solo one.',
  Build: 'You picked Build: hack nights and teams for the hackathons on our list, aiming to place.',
  Launch: 'You picked Launch: for projects you want to keep going after the weekend.',
  'Not sure yet': 'You haven’t picked a track yet, which is fine. Come to a hack night and see what fits.',
}

/** One automatic email before rendering: who it's for, what it says and why they get it. */
interface Draft {
  recipient: Recipient
  subject: string
  body: string
  reason: EmailReason
}

/** The next published event, for the welcome email's "come to" line. */
export async function nextEvent(env: Env): Promise<EventDetails | null> {
  return env.DB.prepare(
    `SELECT title, date, time, place FROM events
     WHERE published = 1 AND placeholder = 0 AND date >= ? ORDER BY date, id LIMIT 1`,
  )
    .bind(bostonToday())
    .first<EventDetails>()
}

export function welcomeDraft(
  origin: string,
  member: { name: string; email: string; track: string; unsubscribeToken: string },
  event: EventDetails | null,
): Draft {
  const body = [
    'Welcome to BU Proto, {{name}}',
    'You’re on the list. We’re BU students who build things and take them to hackathons, and from now on you’ll hear about our hack nights, trips and demo nights here.',
    TRACK_LINES[member.track] ?? TRACK_LINES['Not sure yet'],
    ...(event
      ? [
          'The next thing on the calendar, no experience needed, just bring a laptop:',
          [event.title, `${formatEventDate(event.date)}, ${event.time}`, event.place].filter((line) => line.trim()).join('\n'),
          `RSVP on the events page: ${origin}/events`,
        ]
      : [`Nothing’s on the calendar yet; we’ll email you when it is. Until then, the playbook is the best place to start: ${origin}/resources`]),
    'Questions? Just reply to this email.',
  ].join('\n\n')
  return { recipient: member, subject: 'Welcome to BU Proto', body, reason: { kind: 'member' } }
}

export function rsvpDraft(rsvp: { name: string; email: string }, event: EventDetails): Draft {
  const body = [
    'You’re going, {{name}}',
    'You’re on the list for {{event}} on {{eventDate}}. The details are below.',
    'Plans changed? Reply to this email and we’ll take you off the list.',
  ].join('\n\n')
  return { recipient: rsvp, subject: 'You’re going: {{event}}', body, reason: { kind: 'event', event } }
}

export function fundDraft(person: { name: string; email: string }): Draft {
  const body = [
    'You’re on the grants list, {{name}}',
    'Thanks for telling us about your project. BU Proto microgrants are coming soon, and nobody can apply yet. You’re on the list, so you’ll hear first when they open.',
    'If you want to tell us more in the meantime, reply to this email.',
  ].join('\n\n')
  return { recipient: person, subject: 'You’re on the BU Proto grants list', body, reason: { kind: 'fund' } }
}

export function renderDraft(draft: Draft, origin: string): RenderedEmail {
  return renderEmail({ ...draft, origin })
}

/** Send one draft. Throws on nothing: a failure is logged and counted in the result. */
export async function sendDraft(env: Env, draft: Draft, origin: string, key: AutomaticEmailKey | 'test'): Promise<SendResult> {
  try {
    const email = renderDraft(draft, origin)
    const result = await sendEmails(env, [{ to: draft.recipient.email, ...email }], `${key}-${randomToken(12)}`)
    if (result.failed) console.error(`[email] ${key} to ${draft.recipient.email} failed`)
    return result
  } catch (error) {
    console.error(`[email] ${key} failed:`, error)
    return { sent: 0, failed: 1, logged: false }
  }
}

export async function sendWelcome(
  env: Env,
  origin: string,
  member: { name: string; email: string; track: string; unsubscribeToken: string },
): Promise<void> {
  const event = await nextEvent(env).catch(() => null)
  await sendDraft(env, welcomeDraft(origin, member, event), origin, 'welcome')
}

export async function sendRsvpConfirmation(env: Env, origin: string, rsvp: { name: string; email: string }, event: EventDetails) {
  await sendDraft(env, rsvpDraft(rsvp, event), origin, 'rsvp')
}

export async function sendFundConfirmation(env: Env, origin: string, person: { name: string; email: string }) {
  await sendDraft(env, fundDraft(person), origin, 'fund')
}
