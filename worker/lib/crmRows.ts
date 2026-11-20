// Pure helpers for the Pipeline and Activity routes: turning joined rows into the contract's shapes,
// ordering, and a deal's timeline. No database or Hono here, so `npm test` checks them directly.

import type { DealStage, PersonLink, PersonRef, TimelineItem } from '../../shared/crm.ts'

/** A row's person columns, as the routes select them: the member's or the contact's side is filled. */
export interface PersonColumns {
  member_id: number | null
  member_name: string | null
  contact_id: number | null
  contact_name: string | null
  /** The contact's org, when they have one. */
  contact_org_name: string | null
}

/** The person a row points at, or null when it points at nobody (an interaction about an org). */
export function personLink(row: PersonColumns): PersonLink | null {
  if (row.member_id !== null && row.member_name !== null) return { key: `m${row.member_id}`, name: row.member_name, orgName: null }
  if (row.contact_id !== null && row.contact_name !== null) {
    return { key: `c${row.contact_id}`, name: row.contact_name, orgName: row.contact_org_name ?? null }
  }
  return null
}

/** The member_id and contact_id a person key fills, the other side null (the tables allow only one). */
export function personIds(ref: PersonRef | null): { memberId: number | null; contactId: number | null } {
  if (!ref) return { memberId: null, contactId: null }
  return ref.type === 'member' ? { memberId: ref.id, contactId: null } : { memberId: null, contactId: ref.id }
}

/**
 * Only the fields a PATCH body actually sent. The contract's patch schemas are partials of the
 * create schemas, and zod still fills a missing field's default inside a partial, so without this
 * a PATCH of { stage } would also blank the ask and the notes.
 */
export function sentFields<T extends Record<string, unknown>>(parsed: T, raw: unknown): Partial<T> {
  const sent = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const out: Partial<T> = {}
  for (const key of Object.keys(parsed) as (keyof T & string)[]) {
    if (Object.hasOwn(sent, key)) out[key] = parsed[key]
  }
  return out
}

/** The stage a deal moves to next, or null once it's delivered. */
export function stageAfter(stage: DealStage, stages: readonly DealStage[]): DealStage | null {
  const index = stages.indexOf(stage)
  return index >= 0 && index < stages.length - 1 ? stages[index + 1] : null
}

/**
 * Deals on the board: the one whose next follow-up is soonest first, then the ones without a
 * follow-up, most recently changed first. A deal nobody owes anything on sinks.
 */
export function compareDeals(
  a: { nextFollowUp: { dueOn: string } | null; updatedAt: string; id: number },
  b: { nextFollowUp: { dueOn: string } | null; updatedAt: string; id: number },
): number {
  const aDue = a.nextFollowUp?.dueOn ?? null
  const bDue = b.nextFollowUp?.dueOn ?? null
  if (aDue !== bDue) {
    if (aDue === null) return 1
    if (bDue === null) return -1
    return aDue < bDue ? -1 : 1
  }
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1
  return b.id - a.id
}

/**
 * Follow-ups in the order people work through them: open ones by due day (oldest first, so the
 * late ones lead), then the done ones, most recently ticked first.
 */
export function compareFollowUps(
  a: { dueOn: string; doneAt: string | null; id: number },
  b: { dueOn: string; doneAt: string | null; id: number },
): number {
  const aOpen = a.doneAt === null
  const bOpen = b.doneAt === null
  if (aOpen !== bOpen) return aOpen ? -1 : 1
  if (aOpen) {
    if (a.dueOn !== b.dueOn) return a.dueOn < b.dueOn ? -1 : 1
    return a.id - b.id
  }
  if (a.doneAt !== b.doneAt) return (a.doneAt ?? '') < (b.doneAt ?? '') ? 1 : -1
  return b.id - a.id
}

/** What a deal's history is made from. */
export interface DealHistory {
  deal: { stageLabel: string; ask: string; createdAt: string; updatedAt: string; createdBy: string; passedAt: string | null }
  interactions: { label: string; person: PersonLink | null; summary: string; happenedOn: string; createdBy: string; createdAt: string }[]
  /** Only the done ones belong in history; open ones are listed apart. */
  followUps: { title: string; doneAt: string | null; ownerEmail: string }[]
}

/** First line of some text, for a timeline title. */
const firstLine = (text: string) => text.split('\n').find((line) => line.trim())?.trim() ?? ''

/**
 * Where an interaction sorts among timestamps. It has only a day; logged that same day, the
 * moment it was logged places it among that day's changes, and logged later (backdated), it goes
 * at the end of its day.
 */
export function interactionMoment(happenedOn: string, createdAt: string): string {
  return createdAt.slice(0, 10) === happenedOn ? createdAt : `${happenedOn} 23:59:59`
}

/**
 * A deal's history, newest first: what was logged on it, the follow-ups ticked off, when it was
 * passed, its last change and when it was made.
 */
export function dealTimeline({ deal, interactions, followUps }: DealHistory): TimelineItem[] {
  const items: { item: TimelineItem; moment: string }[] = []
  const push = (item: TimelineItem, moment = item.at) => items.push({ item, moment })
  for (const interaction of interactions) {
    const title = interaction.person ? interaction.person.name : firstLine(interaction.summary) || interaction.label
    push(
      {
        kind: 'interaction',
        label: interaction.label,
        title,
        detail: interaction.person ? interaction.summary : '',
        at: interaction.happenedOn,
        href: interaction.person ? `/admin/people/${interaction.person.key}` : null,
        by: interaction.createdBy,
      },
      interactionMoment(interaction.happenedOn, interaction.createdAt),
    )
  }
  for (const followUp of followUps) {
    if (!followUp.doneAt) continue
    push({ kind: 'deal', label: 'Done', title: followUp.title, detail: '', at: followUp.doneAt, href: null, by: followUp.ownerEmail })
  }
  if (deal.passedAt) {
    push({ kind: 'deal', label: 'Passed', title: 'Marked passed', detail: `It was at ${deal.stageLabel}.`, at: deal.passedAt, href: null, by: null })
  } else if (deal.updatedAt !== deal.createdAt) {
    push({ kind: 'deal', label: 'Stage', title: `At ${deal.stageLabel}`, detail: 'Last changed', at: deal.updatedAt, href: null, by: null })
  }
  push({
    kind: 'deal',
    label: 'Created',
    title: 'Deal created',
    detail: deal.ask ? `Ask: ${deal.ask}` : '',
    at: deal.createdAt,
    href: null,
    by: deal.createdBy,
  })
  // Stable: equal moments keep the order they were pushed in (logged things before the deal's own).
  return items
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => (a.moment === b.moment ? a.index - b.index : a.moment < b.moment ? 1 : -1))
    .map(({ item }) => item)
}
