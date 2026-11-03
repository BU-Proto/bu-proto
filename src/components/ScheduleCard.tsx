import type { ScheduleSlot } from '../content/hero'
import { PinIcon } from './icons'
import styles from './ScheduleCard.module.css'

interface ScheduleCardProps {
  location: string
  slots: readonly ScheduleSlot[]
  className?: string
}

/** The glass "this week" card: where hack night happens and the next sessions. */
export function ScheduleCard({ location, slots, className }: ScheduleCardProps) {
  return (
    <aside className={[styles.card, className].filter(Boolean).join(' ')} aria-label="This week">
      <div className={styles.handle} aria-hidden="true" />
      <p className={styles.location} data-fog-clear>
        <PinIcon />
        {location}
      </p>

      {slots.map((slot) => (
        <div key={`${slot.day} ${slot.start}`} className={styles.slot}>
          <div className={styles.row}>
            <span className={styles.day} data-fog-clear>
              {slot.day}
            </span>
            <span className={styles.level} data-fog-clear>
              <span className={styles.bars} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {slot.level}
            </span>
          </div>

          <div className={styles.times}>
            <div data-fog-clear>
              <small>Start</small>
              <b>{slot.start}</b>
            </div>
            <span className={styles.duration} data-fog-clear="box">
              <span aria-hidden="true">◷</span> {slot.duration}
            </span>
            <div className={styles.end} data-fog-clear>
              <small>End</small>
              <b>{slot.end}</b>
            </div>
          </div>
        </div>
      ))}
    </aside>
  )
}
