// The site's content (events, hackathons, wins, the board, roles) lives in D1 and is edited in the
// portal. Route loaders in App.tsx fetch it through here.

import type { BoardMember, ContentTypes, Hackathon, ProtoEvent, Role, Win } from '../../shared/api'
import type { ContentResource } from '../../shared/constants'
import { api } from './api'
import { imageRatio } from './imageRatio'
import { findByName } from './paths'

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

/**
 * One win for its project page, named by the project (or an old number), plus the list so the
 * page can link to its neighbours. The list holds every published win in full.
 */
export async function fetchWinPage(param: string | undefined, signal?: AbortSignal): Promise<WinPageData> {
  const wins = await fetchContent('wins', signal)
  return { win: findByName(wins, param, (win) => win.project), wins }
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

/**
 * One event for its own page, named by its title (or an old number), plus the rest so it can link
 * to the ones either side. The list holds every published event in full.
 */
export async function fetchEventPage(param: string | undefined, signal?: AbortSignal): Promise<EventPageData> {
  const events = await fetchContent('events', signal)
  const event = findByName(events, param, (item) => item.title)
  const photoRatio = event.photo ? await imageRatio(event.photo) : null
  return { event, events: events.toSorted(byDate), photoRatio }
}

export interface RolePageData {
  role: Role
  /** Every published role, in display order, for the others still open. */
  roles: Role[]
}

/**
 * One role for its own page, named by its title (or an old number), plus the list so the page can
 * point at the others. The list holds every published role in full.
 */
export async function fetchRolePage(param: string | undefined, signal?: AbortSignal): Promise<RolePageData> {
  const roles = await fetchContent('roles', signal)
  return { role: findByName(roles, param, (role) => role.title), roles }
}

export interface BoardPageData {
  board: BoardMember[]
  /** Every published role: the open seats are the Board ones not yet filled. */
  roles: Role[]
}

export async function fetchBoardPage(signal?: AbortSignal): Promise<BoardPageData> {
  const [board, roles] = await Promise.all([fetchContent('board', signal), fetchContent('roles', signal)])
  return { board, roles }
}
