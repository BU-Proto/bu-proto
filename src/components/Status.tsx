import { STATUS_LABEL, type HackathonStatus } from '../lib/hackathons'
import styles from './Status.module.css'

/** Where a hackathon's applications stand: a coloured word with its lamp, nothing around it. */
export function Status({ status, className }: { status: HackathonStatus; className?: string }) {
  return (
    <span className={[styles.status, className].filter(Boolean).join(' ')} data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  )
}
