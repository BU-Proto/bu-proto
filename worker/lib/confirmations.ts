// The emails the public forms send back: a welcome for a new member, a confirmation for an RSVP
// and for the fund list. Each is sent from waitUntil after the form has answered, and never
// throws, so a slow or failing Resend can't hold up or undo a sign-up.

import { bostonToday } from './dates'
import { type EventDetails, formatEventDate, renderEmail, type EmailReason, type Recipient } from './emailTemplate'
import { randomToken } from './crypto'
import { sendEmails } from './resend'

/** What each track is for, said back to someone who just picked it. */
const TRACK_LINES: Record<string, string> = {
  Start: 'You picked Start: workshops and first-hackathon squads, so your first weekend isn’t a solo one.',
  Build: 'You picked Build: hack nights and teams for the hackathons on our list, aiming to place.',
  Launch: 'You picked Launch: for projects you want to keep going after the weekend.',
  'Not sure yet': 'You haven’t picked a track yet, which is fine. Come to a hack night and see what fits.',
}

async function send(env: Env, to: Recipient, subject: string, body: string, reason: EmailReason, origin: string, key: string) {
  try {
    const email = renderEmail({ subject, body, recipient: to, reason, origin })
    const result = await sendEmails(env, [{ to: to.email, ...email }], `${key}-${randomToken(12)}`)
    if (result.failed) console.error(`[email] ${key} to ${to.email} failed`)
  } catch (error) {
    console.error(`[email] ${key} failed:`, error)
  }
}

/** The next published event, for the welcome email's "come to" line. */
async function nextEvent(env: Env): Promise<EventDetails | null> {
  return env.DB.prepare(
    `SELECT title, date, time, place FROM events
     WHERE published = 1 AND placeholder = 0 AND date >= ? ORDER BY date, id LIMIT 1`,
  )
    .bind(bostonToday())
    .first<EventDetails>()
}

export async function sendWelcome(
  env: Env,
  origin: string,
  member: { name: string; email: string; track: string; unsubscribeToken: string },
): Promise<void> {
  const event = await nextEvent(env).catch(() => null)
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
  await send(
    env,
    { email: member.email, name: member.name, track: member.track, unsubscribeToken: member.unsubscribeToken },
    'Welcome to BU Proto',
    body,
    { kind: 'member' },
    origin,
    'welcome',
  )
}

export async function sendRsvpConfirmation(
  env: Env,
  origin: string,
  rsvp: { name: string; email: string },
  event: EventDetails,
): Promise<void> {
  const body = [
    'You’re going, {{name}}',
    'You’re on the list for {{event}} on {{eventDate}}. The details are below.',
    'Plans changed? Reply to this email and we’ll take you off the list.',
  ].join('\n\n')
  await send(env, rsvp, 'You’re going: {{event}}', body, { kind: 'event', event }, origin, 'rsvp')
}

export async function sendFundConfirmation(env: Env, origin: string, person: { name: string; email: string }): Promise<void> {
  const body = [
    'You’re on the grants list, {{name}}',
    'Thanks for telling us about your project. BU Proto microgrants are coming soon, and nobody can apply yet. You’re on the list, so you’ll hear first when they open.',
    'If you want to tell us more in the meantime, reply to this email.',
  ].join('\n\n')
  await send(env, person, 'You’re on the BU Proto grants list', body, { kind: 'fund' }, origin, 'fund')
}
