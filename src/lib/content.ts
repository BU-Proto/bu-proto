// The site's content (events, hackathons, wins, the board, roles) lives in D1 and is edited in the
// portal. Route loaders in App.tsx fetch it through here.

import type { ContentTypes, Hackathon, ProtoEvent, Role, Win } from '../../shared/api'
import type { ContentResource } from '../../shared/constants'
import { api } from './api'
import { imageRatio } from './imageRatio'

/** Published rows of one resource, already in display order. */
export async function fetchContent<R extends ContentResource>(resource: R, signal?: AbortSignal) {
  const { items } = await api<{ items: ContentTypes[R][] }>(`/content/${resource}`, { signal })
  return items
}

export interface HomeData {
  events: ProtoEvent[]
  hackathons: Hackathon[]
  wins: Win[]
}

export async function fetchHome(signal?: AbortSignal): Promise<HomeData> {
  const [events, hackathons, wins] = await Promise.all([
    fetchContent('events', signal),
    fetchContent('hackathons', signal),
    fetchContent('wins', signal),
  ])
  return { events, hackathons, wins }
}

export interface WinPageData {
  win: Win
  /** Every published win, in display order, for previous and next. */
  wins: Win[]
}

/** One win for its project page, plus the list so the page can link to its neighbours. */
export async function fetchWinPage(id: string | undefined, signal?: AbortSignal): Promise<WinPageData> {
  const [{ item }, wins] = await Promise.all([
    api<{ item: Win }>(`/content/wins/${encodeURIComponent(id ?? '')}`, { signal }),
    fetchContent('wins', signal),
  ])
  return { win: item, wins }
}

export interface EventPageData {
  event: ProtoEvent
  /** Every published event, oldest first, for earlier and later. */
  events: ProtoEvent[]
  /**
   * Width over height of the event's own photo, measured before the page renders so it can lay
   * itself out by the picture's shape at once. Null with no photo, or when it couldn't be read in
   * time; the page then corrects itself from the picture once it has loaded.
   */
  photoRatio: number | null
}

const byDate = (a: ProtoEvent, b: ProtoEvent) => a.date.localeCompare(b.date) || a.id - b.id

/** One event for its own page, plus the rest so it can link to the ones either side. */
export async function fetchEventPage(id: string | undefined, signal?: AbortSignal): Promise<EventPageData> {
  // The photo is measured while the list is still on its way, so it rarely adds to the wait.
  const measuredEvent = api<{ item: ProtoEvent }>(`/content/events/${encodeURIComponent(id ?? '')}`, { signal }).then(
    async ({ item }) => ({ event: item, photoRatio: item.photo ? await imageRatio(item.photo) : null }),
  )
  const [{ event, photoRatio }, events] = await Promise.all([measuredEvent, fetchContent('events', signal)])
  return { event, events: events.toSorted(byDate), photoRatio }
}

export interface RolePageData {
  role: Role
  /** Every published role, in display order, for the others still open. */
  roles: Role[]
}

/** One role for its own page, plus the list so the page can point at the others. */
export async function fetchRolePage(id: string | undefined, signal?: AbortSignal): Promise<RolePageData> {
  const [{ item }, roles] = await Promise.all([
    api<{ item: Role }>(`/content/roles/${encodeURIComponent(id ?? '')}`, { signal }),
    fetchContent('roles', signal),
  ])
  return { role: item, roles }
}
