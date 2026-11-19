import type { AskStatus } from '../../../shared/api'

// Plain values the Asks pages share (kept out of the page files so Fast Refresh keeps working).

export const ASK_STATUS_LABELS: Record<AskStatus, string> = { draft: 'Draft', waiting: 'Waiting', answered: 'Answered', closed: 'Closed' }

/** How long to wait for a reply before Claude drafts a follow-up (0 = never). */
export const FOLLOW_UP_CHOICES = [
  { value: 0, label: 'Never' },
  { value: 3, label: 'After 3 days' },
  { value: 5, label: 'After 5 days' },
  { value: 7, label: 'After a week' },
  { value: 14, label: 'After two weeks' },
] as const
