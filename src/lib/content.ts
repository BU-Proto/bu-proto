// The site's content (events, hackathons, wins, the board) lives in D1 and is edited in the
// portal. Route loaders in App.tsx fetch it through here.

import type { ContentTypes, Hackathon, ProtoEvent, Win } from '../../shared/api'
import type { ContentResource } from '../../shared/constants'
import { api } from './api'

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
