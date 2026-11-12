import { useState, type CSSProperties, type ReactNode } from 'react'
import { useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { BuMark } from '../components/BuMark'
import { DetailGallery, DetailLoadError, DetailNav, OutLink, type Person } from '../components/DetailPage'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { EVENT_COVERS, type CoverPhoto } from '../content/covers'
import { EVENT_DETAIL, EVENT_NOT_FOUND, KIND_HUE } from '../content/events'
import { BRAND } from '../content/site'
import { eventToIcs, icsFileName } from '../lib/calendar'
import type { EventPageData } from '../lib/content'
import { dateParts, formatDay } from '../lib/dates'
import { clipAtWord, filled, neighboursOf } from '../lib/detail'
import { mergeHosts, parseEventProse, type ProseBlock, type ProseSection } from '../lib/eventProse'
import { agendaLine, isPast, placeLines } from '../lib/events'
import { rememberImageRatio } from '../lib/imageRatio'
import { useRsvp, type RsvpState } from '../lib/useRsvp'
import styles from './EventDetail.module.css'

/** Width over height from which a picture is wide enough to run across the page as a banner. */
const BANNER_FROM = 1.25
/** The slot held for a picture whose shape isn't known yet: a Luma flyer's 4:5. */
const UNKNOWN_RATIO = 4 / 5
/** A lede longer than this is a paragraph: on a phone it goes under the buttons, not above them. */
const LONG_LEDE = 140
/** A neighbour's title in the earlier / later bar, cut at a word to fit two lines. */
const NEIGHBOUR_NAME_MAX = 60

const mapsUrl = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

/** The title's size steps down as it gets longer, from a name to a sentence. */
const titleSize = (title: string) => (title.length <= 32 ? 'short' : title.length <= 48 ? 'medium' : 'long')

/** A data-driven CSS variable: the picture's own shape, for the frame that holds it. */
const ratioVar = (ratio: number) => ({ '--ratio': ratio }) as CSSProperties

/**
 * An event's own page: the title, when and where and the way in beside (or over) its picture,
 * then the write-up with the schedule and hosts beside it, the photos, and the events either side.
 */
export function EventDetail() {
  const { event, events, photoRatio } = useLoaderData<EventPageData>()
  const { previous, next } = neighboursOf(events, event.id)
  const neighbour = (other: ProtoEvent) => ({
    to: `/events/${other.id}`,
    name: clipAtWord(other.title, NEIGHBOUR_NAME_MAX),
    meta: formatDay(other.date),
  })

  return (
    <>
      <title>{`${event.title} · ${BRAND.full}`}</title>
      {/* Keyed by id: moving to the next event starts its RSVP, and its picture's shape, afresh. */}
      <EventPage key={event.id} event={event} photoRatio={photoRatio}>
        <DetailNav
          quiet
          label={EVENT_DETAIL.navLabel}
          previousLabel={EVENT_DETAIL.previous}
          nextLabel={EVENT_DETAIL.next}
          previous={previous && neighbour(previous)}
          next={next && neighbour(next)}
          all={{ to: '/events', label: EVENT_DETAIL.allEvents }}
        />
      </EventPage>
    </>
  )
}

/** The page for one event. Its picture's shape decides how the opening is laid out. */
function EventPage({ event, photoRatio, children }: { event: ProtoEvent; photoRatio: number | null; children: ReactNode }) {
  const past = isPast(event.date)
  const rsvp = useRsvp(event)
  // Usually measured before the page rendered (see fetchEventPage). When it couldn't be, the
  // picture holds a flyer's slot and reports its real shape once it has loaded.
  const [ownRatio, setOwnRatio] = useState(photoRatio)
  const measure = (image: HTMLImageElement) => {
    if (!event.photo || image.naturalWidth === 0 || image.naturalHeight === 0) return
    const ratio = image.naturalWidth / image.naturalHeight
    rememberImageRatio(event.photo, ratio)
    setOwnRatio(ratio)
  }

  // No photo of its own yet: a BU building matched to the kind of event, known to be wide.
  const cover = EVENT_COVERS[event.kind] ?? EVENT_COVERS['Hack night']
  const flyerRatio = ownRatio ?? UNKNOWN_RATIO
  const shape = event.photo && flyerRatio < BANNER_FROM ? 'flyer' : 'banner'

  return (
    <article className={styles.page} data-shape={shape}>
      {/* The field drains into harbor under the page's intro (see Layout). Over a banner that is
          the text alone, so the drain runs behind the photo. Beside a flyer it is a mark set a
          little above the opening's foot, so the drain has finished where the write-up starts. */}
      <header className={styles.opening}>
        {shape === 'flyer' && <span className={styles.groundMark} data-ground-after="" aria-hidden="true" />}
        <div className={styles.intro} data-ground-after={shape === 'banner' ? '' : undefined}>
          <Head event={event} past={past} rsvp={rsvp} shape={shape} />
          <RsvpForm rsvp={rsvp} className={`${ui.panelDeep} ${styles.rsvp}`} />
        </div>
        {!event.photo ? (
          <Banner key="cover" src={cover.src} alt={cover.alt} cover={cover} />
        ) : shape === 'flyer' ? (
          <Flyer key="flyer" src={event.photo} alt={event.title} ratio={flyerRatio} onLoad={measure} />
        ) : (
          <Banner key="own" src={event.photo} alt={event.title} ratio={flyerRatio} onLoad={measure} />
        )}
      </header>

      <Body event={event} past={past} shape={shape} />

      {(event.gallery ?? []).length > 0 && (
        <div className={styles.photos}>
          <DetailGallery title={EVENT_DETAIL.gallery} images={event.gallery ?? []} label={event.title} />
        </div>
      )}

      {children}
    </article>
  )
}

type Shape = 'flyer' | 'banner'

/**
 * The words of the opening. Beside a flyer, everything in reading order: what it is, what it's
 * about, when and where, the way in. Over a banner only the title, the day and the way in; the
 * place reads under the photo (see Body) and the lede is left to the events list.
 */
function Head({ event, past, rsvp, shape }: { event: ProtoEvent; past: boolean; rsvp: RsvpState; shape: Shape }) {
  const pageUrl = `${window.location.origin}/events/${event.id}`
  const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(eventToIcs(event, pageUrl))}`

  return (
    <div className={styles.head}>
      <h1 className={styles.title} data-size={titleSize(event.title)} data-fog-clear>
        {event.title}
        <SampleTag show={event.placeholder} />
      </h1>
      {shape === 'flyer' && filled(event.text) && (
        <p className={styles.lede} data-long={event.text.length > LONG_LEDE || undefined} data-fog-clear>
          {event.text}
        </p>
      )}
      <div className={styles.entry}>
        <dl className={styles.facts}>
          <When event={event} past={past} />
          {shape === 'flyer' && <Where place={event.place} />}
        </dl>
        {past ? (
          <p className={styles.past} data-fog-clear>
            {EVENT_DETAIL.past}
          </p>
        ) : (
          <div className={styles.actions}>
            <RsvpButton rsvp={rsvp} prominent />
            <a className={ui.secondary} href={ics} download={icsFileName(event.title)} data-fog-clear="box">
              {EVENT_DETAIL.addToCalendar}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/** When: the day as a numeral in its kind's colour, the month over the weekday and the time. */
function When({ event, past }: { event: ProtoEvent; past: boolean }) {
  const { day, monthLong, weekdayLong } = dateParts(event.date)

  return (
    <div className={styles.when} data-hue={KIND_HUE[event.kind]}>
      <dt className={ui.srOnly}>{EVENT_DETAIL.when}</dt>
      <dd>
        <time dateTime={event.date} data-fog-clear>
          <span className={styles.day}>{day}</span>
          <span className={styles.lines}>
            <span className={styles.strong}>
              {monthLong}
              {past && ` ${event.date.slice(0, 4)}`}
            </span>
            <span>
              {weekdayLong}, {event.time}
            </span>
          </span>
        </time>
      </dd>
    </div>
  )
}

/** Where, in the opening: the place's name over the rest of its address, and a way to find it. */
function Where({ place }: { place: string }) {
  const { name, address } = placeLines(place)

  return (
    <div className={styles.where}>
      <dt className={ui.srOnly}>{EVENT_DETAIL.where}</dt>
      <dd className={styles.lines}>
        <span className={styles.strong} data-fog-clear>
          {name}
        </span>
        {address && <span data-fog-clear>{address}</span>}
        <MapLink place={place} />
      </dd>
    </div>
  )
}

/** "Open in Maps": the place, searched for in a new tab. */
function MapLink({ place }: { place: string }) {
  return (
    <a className={`${ui.textLink} ${styles.map}`} href={mapsUrl(place)} target="_blank" rel="noopener noreferrer" data-fog-clear>
      {EVENT_DETAIL.map}
      <span className={styles.mapArrow} aria-hidden="true">
        ↗
      </span>
      <span className={ui.srOnly}> (opens in a new tab)</span>
    </a>
  )
}

/** A portrait or square picture, shown whole, with a soft glow of its own colour behind it. */
function Flyer({ src, alt, ratio, onLoad }: { src: string; alt: string; ratio: number; onLoad: (image: HTMLImageElement) => void }) {
  return (
    <figure className={styles.flyer} style={ratioVar(ratio)}>
      <img className={styles.glow} src={src} alt="" aria-hidden="true" />
      <img className={styles.flyerImage} src={src} alt={alt} fetchPriority="high" onLoad={(event) => onLoad(event.currentTarget)} />
    </figure>
  )
}

/**
 * A wide picture across the column, filling the frame. A default campus `cover` is captioned and
 * credited; the event's own picture has no caption, and its `ratio` only matters when it is wider
 * than the banner.
 */
function Banner({
  src,
  alt,
  ratio,
  cover,
  onLoad,
}: {
  src: string
  alt: string
  ratio?: number
  cover?: CoverPhoto
  onLoad?: (image: HTMLImageElement) => void
}) {
  return (
    <figure className={styles.banner} data-fit={cover ? 'cover' : 'own'} style={ratio ? ratioVar(ratio) : undefined}>
      <div className={styles.frame}>
        <img className={styles.bannerImage} src={src} alt={alt} fetchPriority="high" onLoad={(event) => onLoad?.(event.currentTarget)} />
      </div>
      {cover && (
        <figcaption className={styles.caption}>
          <span>{cover.alt}</span>
          <span>
            {EVENT_DETAIL.photoBy} {cover.author},{' '}
            <a href={cover.source} target="_blank" rel="noopener noreferrer">
              {cover.license} {EVENT_DETAIL.viaCommons}
            </a>
          </span>
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Under the opening: the write-up, with the schedule and the hosts in a column beside it. Under a
 * banner the place heads the side notes, since the opening there leaves it out.
 */
function Body({ event, past, shape }: { event: ProtoEvent; past: boolean; shape: Shape }) {
  // Only a flyer's opening shows the lede, so only there is a write-up that repeats it trimmed.
  const prose = parseEventProse(event.description, { lede: shape === 'flyer' ? event.text : null, date: event.date })
  // A "Hosted by A | B" line at the foot of the write-up names hosts too.
  const hosts: Person[] = mergeHosts<Person>(event.hosts ?? [], prose.hostedBy)
  const agenda = event.agenda ?? []
  const place = shape === 'banner' ? event.place : null
  const hasWriteUp = prose.sections.length > 0
  const hasNotes = place !== null || agenda.length > 0 || hosts.length > 0
  if (!hasWriteUp && !hasNotes) return null

  return (
    <div className={styles.body} data-columns={hasWriteUp && hasNotes ? 2 : 1}>
      {hasWriteUp && <WriteUp sections={prose.sections} label={past ? EVENT_DETAIL.recap : EVENT_DETAIL.about} />}
      {hasNotes && (
        <aside className={styles.notes}>
          {place && <Place place={place} />}
          {agenda.length > 0 && <Schedule agenda={agenda} />}
          {hosts.length > 0 && <Hosts hosts={hosts} />}
        </aside>
      )}
    </div>
  )
}

/** Where it is, as a side note: the name, the rest of the address, and a way to find it. */
function Place({ place }: { place: string }) {
  const { name, address } = placeLines(place)

  return (
    <section className={styles.note} aria-labelledby="place">
      <h2 id="place" className={styles.label}>
        {EVENT_DETAIL.where}
      </h2>
      <p className={styles.place}>
        <span>{name}</span>
        {address && <span className={styles.placeAddress}>{address}</span>}
      </p>
      <MapLink place={place} />
    </section>
  )
}

/**
 * The description, part by part, each under its label. What comes before the text's first
 * sub-heading takes the page's own `label` ("What to expect"), unless the text already has a
 * part by that name.
 */
function WriteUp({ sections, label }: { sections: ProseSection[]; label: string }) {
  const labelTaken = sections.some((section) => section.heading?.toLowerCase() === label.toLowerCase())

  return (
    <div className={styles.writeUp}>
      {sections.map((section, index) => {
        const heading = section.heading ?? (labelTaken ? null : label)
        const id = `write-up-${index}`
        return (
          <section key={id} className={styles.section} aria-labelledby={heading ? id : undefined}>
            {heading && (
              <h2 id={id} className={styles.label} data-fog-clear>
                {heading}
              </h2>
            )}
            <div className={styles.prose}>
              {section.blocks.map((block, blockIndex) => (
                <Block key={blockIndex} block={block} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** One piece of the write-up, set as what it is: running text, a list, facts, or people. */
function Block({ block }: { block: ProseBlock }) {
  if (block.kind === 'paragraph') return <p data-fog-clear>{block.text}</p>

  if (block.kind === 'list') {
    return (
      <ul className={styles.list}>
        {block.items.map((item, index) => (
          <li key={index} data-fog-clear>
            {item}
          </li>
        ))}
      </ul>
    )
  }

  if (block.kind === 'facts') {
    return (
      <dl className={styles.factRows}>
        {block.rows.map((row, index) => (
          <div key={index}>
            <dt data-fog-clear>{row.key}</dt>
            <dd data-fog-clear>{row.value}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <ul className={styles.people}>
      {block.people.map((person, index) => (
        <li key={index} data-fog-clear>
          <span className={styles.personName}>{person.name}</span>
          {person.role && <span>{person.role}</span>}
        </li>
      ))}
    </ul>
  )
}

/** The run of show: each line's time in a column of its own. */
function Schedule({ agenda }: { agenda: readonly string[] }) {
  return (
    <section className={styles.note} aria-labelledby="schedule">
      <h2 id="schedule" className={styles.label} data-fog-clear>
        {EVENT_DETAIL.schedule}
      </h2>
      <ol className={styles.agenda}>
        {agenda.map((line, index) => {
          const { time, what } = agendaLine(line)
          return (
            <li key={`${line}-${index}`} data-fog-clear>
              {time && <span className={styles.agendaTime}>{time}</span>}
              <span className={time ? undefined : styles.agendaWhole}>{what}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Who is putting it on: names stacked, each linking out when there's somewhere to go. */
function Hosts({ hosts }: { hosts: readonly Person[] }) {
  return (
    <section className={styles.note} aria-labelledby="hosts">
      <h2 id="hosts" className={styles.label} data-fog-clear>
        {EVENT_DETAIL.hosts}
      </h2>
      <ul className={styles.hosts}>
        {hosts.map((host, index) => (
          <li key={`${host.name}-${index}`}>
            {host.href ? <OutLink href={host.href}>{host.name}</OutLink> : <span data-fog-clear>{host.name}</span>}
            {host.bu && <BuMark />}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function EventLoadError() {
  return <DetailLoadError copy={EVENT_NOT_FOUND} to="/events" />
}
