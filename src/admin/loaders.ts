// Data for the portal's routes. They live apart from the page components so routes.tsx can
// fetch a page's data while its component chunk is still downloading (react-router's
// per-property lazy), and so the component files only export components.

import { data, type LoaderFunctionArgs, type ShouldRevalidateFunction } from 'react-router'
import type { Admin, Me, Rsvp, Stats } from '../../shared/api'
import { api } from '../lib/api'
import { specFor, type ContentRow } from './lib/content'
import { isUnauthorized } from './lib/session'

export async function layoutLoader({ request }: LoaderFunctionArgs): Promise<{ me: Me | null }> {
  try {
    return { me: await api<Me>('/admin/me', { signal: request.signal }) }
  } catch (error) {
    if (isUnauthorized(error)) return { me: null }
    throw error
  }
}

export async function dashboardLoader({ request }: LoaderFunctionArgs) {
  return api<Stats>('/admin/stats', { signal: request.signal })
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
