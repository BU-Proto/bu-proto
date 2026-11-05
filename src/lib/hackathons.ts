// Small helpers for showing a hackathon, shared by the hackathons list and the home page.

import type { Hackathon } from '../../shared/api'
import { daysUntil } from './dates'

export type HackathonStatus = 'open' | 'closing' | 'closed'

export const STATUS_LABEL: Record<HackathonStatus, string> = { open: 'Open', closing: 'Closing soon', closed: 'Closed' }

/** Where applications stand: closing soon in the last two weeks before apply-by. */
export function statusOf(hackathon: Pick<Hackathon, 'applyBy'>): HackathonStatus {
  const days = daysUntil(hackathon.applyBy)
  if (days < 0) return 'closed'
  return days <= 14 ? 'closing' : 'open'
}
