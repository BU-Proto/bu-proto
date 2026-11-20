import { useCallback, useMemo } from 'react'
import {
  DEAL_STAGES,
  PERSON_KIND_LABELS,
  type Admin,
  type Deal,
  type DealStage,
  type DealType,
  type OrgDetail,
  type PersonDetail,
  type PersonSummary,
} from '../../../shared/api'
import { api } from '../../lib/api'
import { useApi } from '../pages/people/useApi'
import { messageFor, useAuthGuard, useSession } from './session'
import { useToast } from './toast'

// Days, owners and money for the Pipeline and Activity pages and their dialogs. Days are Boston
// days (yyyy-mm-dd): a follow-up "due today" means today in Boston, wherever the teammate is.

/** Today in Boston as yyyy-mm-dd. */
export function bostonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

/** yyyy-mm-dd plus some days. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Whole days from one yyyy-mm-dd to another. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
}

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const monthDayYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })

/** "Nov 18", or "Nov 18, 2025" from another year. Takes a day or a SQLite timestamp (as its UTC day). */
export function formatDay(value: string): string {
  const day = value.slice(0, 10)
  const date = new Date(`${day}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return day.slice(0, 4) === bostonToday().slice(0, 4) ? monthDay.format(date) : monthDayYear.format(date)
}

/** The Boston day of a SQLite timestamp ("2026-11-20 01:30:00" is the evening of Nov 19). */
export function stampDay(stamp: string): string {
  const date = new Date(`${stamp.replace(' ', 'T')}${/Z|[+-]\d\d:?\d\d$/.test(stamp) ? '' : 'Z'}`)
  if (Number.isNaN(date.getTime())) return stamp.slice(0, 10)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(date)
}

/** A day that happened: "Today", "Yesterday", then "Nov 16". */
export function formatPastDay(day: string, today = bostonToday()): string {
  const ago = daysBetween(day, today)
  if (ago === 0) return 'Today'
  if (ago === 1) return 'Yesterday'
  return formatDay(day)
}

export type DueTone = 'late' | 'today' | 'soon' | 'later'

/**
 * When a follow-up is due, the way people say it: "2 days late", "Today", "Tomorrow", "Mon",
 * then "Dec 1". The tone colours it: late in coral, today in amber.
 */
export function dueLabel(dueOn: string, today = bostonToday()): { text: string; tone: DueTone } {
  const days = daysBetween(today, dueOn)
  if (days < 0) return { text: days === -1 ? '1 day late' : `${-days} days late`, tone: 'late' }
  if (days === 0) return { text: 'Today', tone: 'today' }
  if (days === 1) return { text: 'Tomorrow', tone: 'soon' }
  if (days < 7) return { text: weekday.format(new Date(`${dueOn}T12:00:00Z`)), tone: 'soon' }
  return { text: formatDay(dueOn), tone: 'later' }
}

/** "$3,000" from cents; whole dollars unless there are cents. */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

/** "3,000" or "$3,000.50" typed into a field → cents, '' → null, nonsense → undefined. */
export function parseDollars(value: string): number | null | undefined {
  const cleaned = value.replace(/[$,\s]/g, '')
  if (!cleaned) return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined
  return Math.round(Number(cleaned) * 100)
}

/** Two letters for an avatar, from a name or an email's first part. */
export function initials(nameOrEmail: string): string {
  const base = nameOrEmail.split('@')[0]
  const words = base.split(/[\s._-]+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

export interface Owner {
  email: string
  /** What the owner list shows: "You" for the signed-in admin, their email for everyone else. */
  label: string
}

/**
 * Everyone who can own a follow-up or a deal: the portal's admins, the signed-in one first as
 * "You". If the list can't load, it's still the signed-in admin, so a form can always be sent.
 */
export function useOwners(): { owners: Owner[]; me: string; labelFor: (email: string | null) => string } {
  const { me } = useSession()
  const { data } = useApi<{ items: Admin[] }>('/admin/admins')
  return useMemo(() => {
    const mine = me.email.toLowerCase()
    const others = (data?.items ?? []).map((admin) => admin.email.toLowerCase()).filter((email) => email !== mine)
    const owners = [{ email: mine, label: 'You' }, ...[...new Set(others)].map((email) => ({ email, label: email }))]
    const labelFor = (email: string | null) => (!email ? 'No one' : email.toLowerCase() === mine ? 'You' : email)
    return { owners, me: mine, labelFor }
  }, [data, me.email])
}

// ---- Deals ------------------------------------------------------------------------------------

/** Each deal type's dot (a .state tone): sponsorships amber (money), partnerships sky, speakers and visits mint. */
export const DEAL_TYPE_TONES: Record<DealType, string> = { sponsor: 'sample', partner: 'filled', visit: 'live' }

/** The stage after this one, or null once it's delivered. */
export function nextStage(stage: DealStage): DealStage | null {
  const index = DEAL_STAGES.indexOf(stage)
  return index < DEAL_STAGES.length - 1 ? DEAL_STAGES[index + 1] : null
}

/**
 * After a sponsorship commits: if its org isn't on a logo wall yet, offer to put it on the
 * Sponsors wall from the toast. If the org can't be looked up, the offer is made anyway; putting
 * an org that's already there on the wall again changes nothing.
 */
export function useOfferSponsorWall(): (deal: Pick<Deal, 'orgId' | 'orgName' | 'type'>) => Promise<void> {
  const toast = useToast()
  const guard = useAuthGuard()
  return useCallback(
    async (deal) => {
      if (deal.type !== 'sponsor') return
      try {
        const { item } = await api<{ item: OrgDetail }>(`/admin/orgs/${deal.orgId}`)
        if (item.wall) return
      } catch (error) {
        if (guard(error)) return
      }
      toast({
        text: `${deal.orgName} committed`,
        detail: 'Put them on the Sponsors logo wall?',
        action: {
          label: 'Add to wall',
          onAction: () => {
            api(`/admin/orgs/${deal.orgId}`, { method: 'PATCH', body: { wall: 'sponsors' } })
              .then(() => toast({ text: `${deal.orgName} is on the Sponsors wall`, detail: 'Add their logo in Orgs if it’s missing.' }))
              .catch((error: unknown) => {
                if (guard(error)) return
                toast({ text: 'Couldn’t put them on the wall', detail: messageFor(error), tone: 'error' })
              })
          },
        },
      })
    },
    [guard, toast],
  )
}

// ---- People in pickers --------------------------------------------------------------------------

/** Someone picked in a PersonPicker: their key for the API, and how to show them. */
export interface PickedPerson {
  key: string
  name: string
  /** A second line: their title and org, or what kind of person they are. */
  detail: string
}

/** "Partner, Northline Ventures", or "Lead" for someone with no org. */
export const personDetail = (person: Pick<PersonSummary, 'kind' | 'orgName' | 'title'>) =>
  person.orgName ? (person.title ? `${person.title}, ${person.orgName}` : person.orgName) : PERSON_KIND_LABELS[person.kind]

export const toPicked = (person: PersonSummary): PickedPerson => ({ key: person.key, name: person.name, detail: personDetail(person) })

/**
 * The person behind a key, for a picker that opens prefilled ("Log interaction" on someone's
 * page). Null while it loads; `failed` if People can't say, and the picker shows a stand-in.
 */
export function usePickedPerson(key: string | null | undefined): { person: PickedPerson | null; failed: boolean } {
  const { data, error } = useApi<{ item: PersonDetail }>(key ? `/admin/people/${key}` : null)
  if (!key) return { person: null, failed: false }
  if (data?.item && data.item.key === key) return { person: toPicked(data.item), failed: false }
  return { person: null, failed: Boolean(error) }
}
