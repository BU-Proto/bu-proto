// Small helpers for showing a role, shared by the list and the role's own page.

import type { Role } from '../../shared/api'
import { daysUntil, formatDay } from './dates'

/** Still taking applications: not filled, and no apply-by day or one that hasn't passed. */
export const roleIsOpen = (role: Pick<Role, 'applyBy' | 'filled'>) => !role.filled && (!role.applyBy || daysUntil(role.applyBy) >= 0)

/** A role on the board, by its team in the portal. */
export const isBoardRole = (role: Pick<Role, 'team'>) => role.team.trim().toLowerCase() === 'board'

/** The board seats still open, in the portal's order: what /board and /about list as open. */
export const openSeats = (roles: readonly Role[]) => roles.filter((role) => isBoardRole(role) && roleIsOpen(role))

/** How long a role has left, and whether that's soon enough to say so in amber. */
export function deadlineOf(role: Pick<Role, 'applyBy'>, untilFilled: string): { text: string; soon: boolean } {
  if (!role.applyBy) return { text: untilFilled, soon: false }
  const days = daysUntil(role.applyBy)
  if (days < 0) return { text: `Closed ${formatDay(role.applyBy)}`, soon: false }
  if (days === 0) return { text: 'Closes today', soon: true }
  if (days === 1) return { text: 'Closes tomorrow', soon: true }
  if (days <= 7) return { text: `Closes in ${days} days`, soon: true }
  return { text: `Apply by ${formatDay(role.applyBy)}`, soon: false }
}
