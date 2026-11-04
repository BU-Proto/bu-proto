import { useLoaderData } from 'react-router'
import type { Hackathon } from '../../shared/api'
import {
  AsideSection,
  DetailGallery,
  DetailLoadError,
  DetailNav,
  DetailOpener,
  DetailPage,
  DetailTitle,
  Prose,
  WriteUp,
  WriteUpSection,
} from '../components/DetailPage'
import { AccoladePlates } from '../components/Accolades'
import detail from '../components/DetailPage.module.css'
import { Status } from '../components/Status'
import ui from '../components/ui.module.css'
import { HACKATHON_DETAIL, HACKATHON_NOT_FOUND } from '../content/hackathons'
import { BRAND } from '../content/site'
import type { HackathonPageData } from '../lib/content'
import { dateParts, formatDay, formatRange } from '../lib/dates'
import { filled, neighboursOf } from '../lib/detail'
import { statusOf, winIsFrom } from '../lib/hackathons'
import styles from './HackathonDetail.module.css'

const COPY = HACKATHON_DETAIL

/** "Tuesday, December 15" */
function longDay(iso: string) {
  const { weekdayLong, monthLong, day } = dateParts(iso)
  return `${weekdayLong}, ${monthLong} ${day}`
}

/** A hackathon's own page: where and when, how to get in, how we're getting there, and what we've won. */
export function HackathonDetail() {
  const { hackathon, hackathons, wins } = useLoaderData<HackathonPageData>()
  const { previous, next } = neighboursOf(hackathons, hackathon.id)
  const status = statusOf(hackathon)
  const pastWins = wins.filter((win) => winIsFrom(win.event, hackathon.name))
  const neighbour = (other: Hackathon) => ({
    to: `/hackathons/${other.id}`,
    name: other.name,
    meta: formatRange(other.starts, other.ends),
  })

  return (
    <DetailPage>
      <title>{`${hackathon.name} · ${BRAND.full}`}</title>

      <DetailOpener photo={hackathon.photo} alt={hackathon.name}>
        <p className={detail.kicker} data-fog-clear>
          {formatRange(hackathon.starts, hackathon.ends)}, {hackathon.ends.slice(0, 4)}
          <span className={detail.kickerNote} data-fog-clear>
            {hackathon.location}
          </span>
        </p>
        <DetailTitle sample={hackathon.placeholder}>{hackathon.name}</DetailTitle>
        <p className={`${detail.note} ${styles.status}`} data-fog-clear>
          <Status status={status} className={styles.lamp} />
          <span>{status === 'closed' ? COPY.applyClosed(formatDay(hackathon.applyBy)) : COPY.applyBy(formatDay(hackathon.applyBy))}</span>
        </p>
        {(hackathon.tripSignup || hackathon.href) && (
          <div className={detail.actions}>
            {hackathon.tripSignup && (
              <a className={ui.primary} href={hackathon.tripSignup} target="_blank" rel="noopener noreferrer" data-fog-clear="box">
                {COPY.signUp} <span aria-hidden="true">↗</span>
              </a>
            )}
            {hackathon.href && (
              <a
                className={hackathon.tripSignup ? ui.secondary : ui.primary}
                href={hackathon.href}
                target="_blank"
                rel="noopener noreferrer"
                data-fog-clear="box"
              >
                {COPY.website} <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </DetailOpener>

      <WriteUp
        main={
          (filled(hackathon.description) || filled(hackathon.trip)) && (
            <>
              {filled(hackathon.description) && (
                <WriteUpSection id="about" title={COPY.about}>
                  <Prose text={hackathon.description} />
                </WriteUpSection>
              )}
              {filled(hackathon.trip) && (
                <WriteUpSection id="trip" title={COPY.trip}>
                  <Prose text={hackathon.trip} />
                </WriteUpSection>
              )}
            </>
          )
        }
        aside={
          <AsideSection id="facts" title={COPY.facts}>
            {/* Said plainly, one fact a line. */}
            <ul className={detail.ruled}>
              <li data-fog-clear>
                {status === 'closed' ? COPY.applyClosed(longDay(hackathon.applyBy)) : COPY.applyBy(longDay(hackathon.applyBy))}
              </li>
              <li data-fog-clear>{hackathon.travelCovered ? COPY.travelCovered : COPY.travelNotCovered}</li>
              <li data-fog-clear>{COPY.going(hackathon.buGoing)}</li>
            </ul>
          </AsideSection>
        }
      />

      {pastWins.length > 0 && (
        <section className={styles.wins} aria-labelledby="wins">
          <h2 id="wins" className={ui.sectionTitle} data-fog-clear>
            {COPY.wins}
          </h2>
          <AccoladePlates wins={pastWins} />
        </section>
      )}

      <DetailGallery title={COPY.gallery} images={hackathon.gallery ?? []} label={hackathon.name} />

      <DetailNav
        label="More hackathons"
        previousLabel={COPY.previous}
        nextLabel={COPY.next}
        previous={previous && neighbour(previous)}
        next={next && neighbour(next)}
        all={{ to: '/hackathons', label: COPY.allHackathons }}
      />
    </DetailPage>
  )
}

export function HackathonLoadError() {
  return <DetailLoadError copy={HACKATHON_NOT_FOUND} to="/hackathons" />
}
