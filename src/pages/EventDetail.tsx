import { useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import {
  AsideSection,
  DetailGallery,
  DetailLoadError,
  DetailNav,
  DetailOpener,
  DetailPage,
  DetailTitle,
  OutLink,
  PeopleList,
  Prose,
  WriteUp,
  WriteUpSection,
} from '../components/DetailPage'
import detail from '../components/DetailPage.module.css'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import ui from '../components/ui.module.css'
import { EVENT_COVERS } from '../content/covers'
import { EVENT_DETAIL, EVENT_NOT_FOUND, KIND_HUE } from '../content/events'
import { BRAND } from '../content/site'
import { eventToIcs, icsFileName } from '../lib/calendar'
import type { EventPageData } from '../lib/content'
import { dateParts, formatDay } from '../lib/dates'
import { filled, neighboursOf } from '../lib/detail'
import { agendaLine, isPast, kindAddsInfo } from '../lib/events'
import { useRsvp } from '../lib/useRsvp'
import styles from './EventDetail.module.css'

const mapsUrl = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

/** An event's own page: the date and the RSVP up top, then the write-up, the schedule and the photos. */
export function EventDetail() {
  const { event, events } = useLoaderData<EventPageData>()
  const { previous, next } = neighboursOf(events, event.id)
  const past = isPast(event.date)

  const agenda = event.agenda ?? []
  const hosts = event.hosts ?? []
  const neighbour = (other: ProtoEvent) => ({ to: `/events/${other.id}`, name: other.title, meta: formatDay(other.date) })

  return (
    <DetailPage>
      <title>{`${event.title} · ${BRAND.full}`}</title>

      {/* Keyed by id: moving to the next event starts its RSVP afresh. */}
      <Opener key={event.id} event={event} past={past} />

      <WriteUp
        main={
          filled(event.description) && (
            <WriteUpSection id="about" title={past ? EVENT_DETAIL.recap : EVENT_DETAIL.about}>
              <Prose text={event.description} />
            </WriteUpSection>
          )
        }
        aside={
          <>
            {agenda.length > 0 && (
              <AsideSection id="schedule" title={EVENT_DETAIL.schedule}>
                <ol className={`${detail.ruled} ${styles.agenda}`}>
                  {agenda.map((line, i) => {
                    const { time, what } = agendaLine(line)
                    return (
                      <li key={`${line}-${i}`} data-fog-clear>
                        <span className={styles.agendaTime}>{time}</span>
                        <span>{what}</span>
                      </li>
                    )
                  })}
                </ol>
              </AsideSection>
            )}

            {hosts.length > 0 && (
              <AsideSection id="hosts" title={EVENT_DETAIL.hosts}>
                <PeopleList people={hosts} />
              </AsideSection>
            )}

            <AsideSection id="place" title={EVENT_DETAIL.place}>
              <p className={styles.place} data-fog-clear>
                {event.place}
              </p>
              <p className={styles.map}>
                <OutLink href={mapsUrl(event.place)}>{EVENT_DETAIL.map}</OutLink>
              </p>
            </AsideSection>
          </>
        }
      />

      <DetailGallery title={EVENT_DETAIL.gallery} images={event.gallery ?? []} label={event.title} />

      <DetailNav
        label="More events"
        previousLabel={EVENT_DETAIL.previous}
        nextLabel={EVENT_DETAIL.next}
        previous={previous && neighbour(previous)}
        next={next && neighbour(next)}
        all={{ to: '/events', label: EVENT_DETAIL.allEvents }}
      />
    </DetailPage>
  )
}

function Opener({ event, past }: { event: ProtoEvent; past: boolean }) {
  // No photo of its own yet: a BU building matched to the kind of event, credited on the page.
  const cover = EVENT_COVERS[event.kind] ?? EVENT_COVERS['Hack night']
  const rsvp = useRsvp(event)
  const { day, monthLong, weekdayLong } = dateParts(event.date)

  const pageUrl = `${window.location.origin}/events/${event.id}`
  const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(eventToIcs(event, pageUrl))}`

  return (
    <DetailOpener
      photo={event.photo || cover.src}
      alt={event.photo ? event.title : cover.alt}
      credit={event.photo ? undefined : cover}
      hugeName={false}
    >
      {/* The date set the way the home page sets the next event's: the day huge, the rest beside it. */}
      <p className={styles.date} data-hue={KIND_HUE[event.kind]} data-fog-clear>
        <span className={styles.day}>{day}</span>
        <span className={styles.monthWeek}>
          {monthLong}
          {past && ` ${event.date.slice(0, 4)}`}
          <br />
          {weekdayLong}
        </span>
      </p>
      <DetailTitle sample={event.placeholder}>{event.title}</DetailTitle>
      {filled(event.text) && (
        <p className={detail.lede} data-fog-clear>
          {event.text}
        </p>
      )}
      {/* Kind, time and place, set apart by space and tone rather than separators. */}
      <p className={`${detail.note} ${styles.meta}`} data-hue={KIND_HUE[event.kind]} data-fog-clear>
        {kindAddsInfo(event.kind, event.title) && <span className={styles.kind}>{event.kind}</span>}
        <span className={styles.time}>{event.time}</span>
        <span>{event.place}</span>
      </p>

      {past ? (
        <p className={styles.past} data-fog-clear>
          {EVENT_DETAIL.past}
        </p>
      ) : (
        <>
          <div className={detail.actions}>
            <RsvpButton rsvp={rsvp} prominent />
            <a className={ui.secondary} href={ics} download={icsFileName(event.title)} data-fog-clear="box">
              {EVENT_DETAIL.addToCalendar}
            </a>
          </div>
          <RsvpForm rsvp={rsvp} className={`${ui.panelDeep} ${styles.rsvp}`} />
        </>
      )}
    </DetailOpener>
  )
}

export function EventLoadError() {
  return <DetailLoadError copy={EVENT_NOT_FOUND} to="/events" />
}
