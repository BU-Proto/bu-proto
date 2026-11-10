// Data for the portal's routes. They live apart from the page components so routes.tsx can
// fetch a page's data while its component chunk is still downloading (react-router's
// per-property lazy), and so the component files only export components.

import { data, type LoaderFunctionArgs, type ShouldRevalidateFunction } from 'react-router'
import type { Admin, FundInterest, Me, Member, Rsvp, Stats } from '../../shared/api'
import { api } from '../lib/api'
import { specFor, type ContentRow } from './lib/content'
import { isUnauthorized } from './lib/session'

export async function layoutLoader({ request }: LoaderFunctionArgs): Promise<{ me: Me | null; stats: Stats | null }> {
  const { signal } = request
  // The counts only feed the sidebar's "new" figure, so the portal opens without them if they fail.
  const stats = api<Stats>('/admin/stats', { signal }).catch(() => null)
  try {
    return { me: await api<Me>('/admin/me', { signal }), stats: await stats }
  } catch (error) {
    if (isUnauthorized(error)) return { me: null, stats: null }
    throw error
  }
}

export async function dashboardLoader({ request }: LoaderFunctionArgs) {
  const { signal } = request
  // The overview reads the lists themselves (they're small) so it can say what's next and who's
  // new, not just how many. The counts are the one part it can't do without; a list that fails
  // leaves its part of the page empty.
  const list = <T>(path: string) =>
    api<{ items: T[] }>(path, { signal })
      .then((body) => body.items)
      .catch(() => [] as T[])
  const [stats, events, hackathons, members, fund] = await Promise.all([
    api<Stats>('/admin/stats', { signal }),
    list<ContentRow>('/admin/content/events'),
    list<ContentRow>('/admin/content/hackathons'),
    list<Member>('/admin/members'),
    list<FundInterest>('/admin/fund'),
  ])
  // The time the page was loaded: "today" and "this week" are worked out from it, so a re-render
  // can't land on a different day than the data did.
  return { stats, events, hackathons, members, fund, now: Date.now() }
}

export async function contentListLoader({ params, request }: LoaderFunctionArgs) {
  const spec = specFor(params.resource)
  const { items } = await api<{ items: ContentRow[] }>(`/admin/content/${spec.resource}`, { signal: request.signal })
  return { resource: spec.resource, items }
}

// The list's filter is client-side, so switching it shouldn't refetch.
export const contentListShouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) =>
  !formMethod && currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate

export async function contentEditorLoader({ params, request }: LoaderFunctionArgs) {
  const spec = specFor(params.resource)
  const resource = spec.resource
  if (params.id === undefined) return { resource, item: null, rsvps: null }

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) throw data('Not found', { status: 404, statusText: 'Not found' })
  const { signal } = request
  // The contract has no single-row GET, so the row comes out of the admin list (which also
  // carries rsvpCount for events). Lists are small (tens of rows), so that's cheap.
  const [{ items }, rsvps] = await Promise.all([
    api<{ items: ContentRow[] }>(`/admin/content/${resource}`, { signal }),
    resource === 'events' ? api<{ items: Rsvp[] }>(`/admin/events/${id}/rsvps`, { signal }).then((body) => body.items) : null,
  ])
  const item = items.find((row) => row.id === id)
  if (!item) throw data('Not found', { status: 404, statusText: 'Not found' })
  return { resource, item, rsvps }
}

export async function adminsLoader({ request }: LoaderFunctionArgs) {
  const { items } = await api<{ items: Admin[] }>('/admin/admins', { signal: request.signal })
  return items
}

export function notFoundLoader(): never {
  throw data('Not found', { status: 404, statusText: 'Not found' })
}
