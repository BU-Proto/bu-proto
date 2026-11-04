import { Link, useLoaderData } from 'react-router'
import type { Hackathon } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import { Status } from '../components/Status'
import ui from '../components/ui.module.css'
import { BOARD_LABELS, HACKATHONS_EMPTY, HACKATHONS_INTRO, TRAVEL_NOTE } from '../content/hackathons'
import { daysUntil, formatDay, formatRange } from '../lib/dates'
import { statusOf } from '../lib/hackathons'
import styles from './Hackathons.module.css'

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
  const hackathons = useLoaderData<Hackathon[]>()
  const upcoming = hackathons.filter((hackathon) => daysUntil(hackathon.ends) >= 0).sort((a, b) =>
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

        {upcoming.length === 0 && (
          <p className={styles.empty} data-fog-clear>
            {HACKATHONS_EMPTY}
          </p>
        )}

        {upcoming.length > 0 && (
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
                <tr key={hackathon.id} className={styles.row}>
                  <td className={styles.dates} data-label="Dates">
                    <span data-fog-clear>{formatRange(hackathon.starts, hackathon.ends)}</span>
                  </td>
                  <th scope="row" className={styles.name}>
                    {/* Stretched over the row: the whole row opens the hackathon's page. */}
                    <Link className={styles.rowLink} to={`/hackathons/${hackathon.id}`} data-fog-clear>
                      {hackathon.name}
                    </Link>
                    <SampleTag show={hackathon.placeholder} />
                  </th>
                  <td className={styles.where} data-label="Where">
                    <span data-fog-clear>{hackathon.location}</span>
                  </td>
                  <td data-label="Apply by">
                    <span className={styles.apply} data-fog-clear>
                      <span className={styles.applyDate}>{formatDay(hackathon.applyBy)}</span>
                      <Status status={status} />
                    </span>
                  </td>
                  <td data-label="Travel">
                    <span className={styles.travel} data-covered={hackathon.travelCovered} data-fog-clear>
                      {hackathon.travelCovered ? 'Covered' : 'Not confirmed'}
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
        )}
      </section>

      <p className={styles.footnote} data-fog-clear>
        {TRAVEL_NOTE}
      </p>
    </div>
  )
}
