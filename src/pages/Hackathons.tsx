import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD_LABELS, HACKATHONS, HACKATHONS_INTRO, TRAVEL_NOTE, type Hackathon } from '../content/hackathons'
import { daysUntil, formatDay, formatRange } from '../lib/dates'
import styles from './Hackathons.module.css'

type Status = 'open' | 'closing' | 'closed'

const STATUS_LABEL: Record<Status, string> = { open: 'Open', closing: 'Closing soon', closed: 'Closed' }

function statusOf(hackathon: Hackathon): Status {
  const days = daysUntil(hackathon.applyBy)
  if (days < 0) return 'closed'
  return days <= 14 ? 'closing' : 'open'
}

/** Up to ten seats drawn as dots, then a count. */
function Seats({ count }: { count: number }) {
  return (
    <span className={styles.seats} data-fog-clear>
      <span className={styles.dots} aria-hidden="true">
        {Array.from({ length: Math.min(count, 10) }, (_, index) => (
          <i key={index} />
        ))}
      </span>
      {count}
    </span>
  )
}

/** Upcoming hackathons, as a departures board. */
export function Hackathons() {
  const upcoming = HACKATHONS.filter((hackathon) => daysUntil(hackathon.ends) >= 0).sort((a, b) =>
    a.starts.localeCompare(b.starts),
  )

  return (
    <div className={ui.page}>
      <PageIntro intro={HACKATHONS_INTRO} />

      <section className={`${ui.panelDeep} ${styles.board}`} aria-label="Upcoming hackathons">
        <div className={styles.boardHead} aria-hidden="true">
          <span data-fog-clear>{BOARD_LABELS.left}</span>
          <span data-fog-clear>{BOARD_LABELS.right}</span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Dates</th>
              <th scope="col">Hackathon</th>
              <th scope="col">Where</th>
              <th scope="col">Apply by</th>
              <th scope="col">Travel</th>
              <th scope="col">BU going</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((hackathon) => {
              const status = statusOf(hackathon)
              return (
                <tr key={hackathon.name}>
                  <td className={styles.dates} data-label="Dates">
                    <span data-fog-clear>{formatRange(hackathon.starts, hackathon.ends)}</span>
                  </td>
                  <th scope="row" className={styles.name}>
                    <a href={hackathon.href} target="_blank" rel="noreferrer" data-fog-clear>
                      {hackathon.name}
                    </a>
                    <SampleTag show={hackathon.placeholder} />
                  </th>
                  <td data-label="Where">
                    <span data-fog-clear>{hackathon.location}</span>
                  </td>
                  <td data-label="Apply by">
                    <span className={styles.apply} data-fog-clear>
                      {formatDay(hackathon.applyBy)}
                      <span className={styles.status} data-status={status}>
                        {STATUS_LABEL[status]}
                      </span>
                    </span>
                  </td>
                  <td data-label="Travel">
                    <span className={styles.travel} data-covered={hackathon.travelCovered} data-fog-clear>
                      {hackathon.travelCovered ? 'Covered' : 'Not covered'}
                    </span>
                  </td>
                  <td data-label="BU going">
                    <Seats count={hackathon.buGoing} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <p className={styles.footnote} data-fog-clear>
        {TRAVEL_NOTE}
      </p>
    </div>
  )
}
