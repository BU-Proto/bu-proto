// The address of each event, win and role page: its name, never its number. Links from before
// pages were named (/events/12) still find their page, and the route sends them on to the name.

import type { ProtoEvent, Role, Win } from '../../shared/api'
import { slugOf } from '../../shared/slug'
import { ApiError } from './api'

export const eventPath = (event: Pick<ProtoEvent, 'title'>) => `/events/${slugOf(event.title)}`
export const winPath = (win: Pick<Win, 'project'>) => `/wins/${slugOf(win.project)}`
export const rolePath = (role: Pick<Role, 'title'>) => `/roles/${slugOf(role.title)}`

/**
 * The item a /…/:slug address names, out of the published list: by its name, or by its number for
 * an old link. A 404 when it names nothing, so the page shows its not-found state.
 */
export function findByName<T extends { id: number }>(items: readonly T[], param: string | undefined, nameOf: (item: T) => string): T {
  const key = (param ?? '').toLowerCase()
  const found =
    items.find((item) => slugOf(nameOf(item)) === key) ??
    (/^\d+$/.test(key) ? items.find((item) => item.id === Number(key)) : undefined)
  if (!found) throw new ApiError(404, { error: 'Not found.' })
  return found
}
