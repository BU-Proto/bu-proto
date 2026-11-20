import { QUEUE_SOURCES, type QueueSource } from '../../shared/crm'

// What "waiting" means in each of the Inbox's queues, in one place, so the Inbox's tabs, Today's
// counts and the sidebar's badge can't disagree.
//   email        a conversation that's on us (status open)
//   signup       a sign-up nobody has looked at yet
//   fund         a fund request that's new or being reviewed (approved and declined are decided)
//   application  a role application nobody has read
//   board        board interest nobody has answered

export const WAITING_WHERE: Record<QueueSource, string> = {
  email: "status = 'open'",
  signup: 'reviewed_at IS NULL',
  fund: "status IN ('new', 'reviewing')",
  application: "status = 'new'",
  board: 'reviewed_at IS NULL',
}

export const QUEUE_TABLES: Record<QueueSource, string> = {
  email: 'mail_threads',
  signup: 'members',
  fund: 'fund_interest',
  application: 'role_applications',
  board: 'board_interest',
}

const countSql = (source: QueueSource) => `(SELECT COUNT(*) FROM ${QUEUE_TABLES[source]} WHERE ${WAITING_WHERE[source]})`

/** Everything waiting, as one SQL expression, for a SELECT that counts other things too (the sidebar's stats). */
export const QUEUE_WAITING_TOTAL_SQL = QUEUE_SOURCES.map(countSql).join(' + ')

/** How many are waiting in each queue. */
export async function waitingCounts(db: D1Database): Promise<Record<QueueSource, number>> {
  const row = await db
    .prepare(`SELECT ${QUEUE_SOURCES.map((source) => `${countSql(source)} AS ${source}`).join(', ')}`)
    .first<Record<QueueSource, number>>()
  return Object.fromEntries(QUEUE_SOURCES.map((source) => [source, row?.[source] ?? 0])) as Record<QueueSource, number>
}
