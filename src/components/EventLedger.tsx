import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { EVENT_LEDGER, KIND_HUE } from '../content/events'
import { dateParts, daysUntil } from '../lib/dates'
import { onFrame } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import { createWakeField } from '../lib/wakeField'
import { MaskLines } from './motion/MaskLines'
import styles from './EventLedger.module.css'

/** Each size of night, by its glyph from the trail: small ○, medium >, big _. */
const HUE_GLYPH = { sky: '○', iris: '>', rose: '_' } as const

const byDate = (a: ProtoEvent, b: ProtoEvent) => a.date.localeCompare(b.date) || a.id - b.id

const LUMA_UPLOADS = 'https://images.lumacdn.com/uploads/'
/** Keeps a raised photo clear of the top bar. */
const NAV_CLEARANCE = 64
const SCREEN_MARGIN = 16

/** Imported covers stay on Luma's servers; its CDN sends them at the size they're shown. */
function coverUrl(photo: string) {
  if (!photo.startsWith(LUMA_UPLOADS)) return photo
  return `https://images.lumacdn.com/cdn-cgi/image/format=auto,width=800,quality=80/uploads/${photo.slice(LUMA_UPLOADS.length)}`
}

/** The events by kind, the kind with the soonest upcoming night first; past nights at each kind's end. */
function byKind(events: readonly ProtoEvent[]) {
  const groups = new Map<ProtoEvent['kind'], ProtoEvent[]>()
  const ordered = [...events].sort(byDate)
  const upcoming = ordered.filter((event) => daysUntil(event.date) >= 0)
  const past = ordered.filter((event) => daysUntil(event.date) < 0).reverse()
  for (const event of [...upcoming, ...past]) groups.set(event.kind, [...(groups.get(event.kind) ?? []), event])
  return [...groups]
}

/** The giant words and the cursor's wake, stuck to the screen while the section passes under it. */
function WakeStage({ section }: { section: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const surface = canvas.current
    const box = section.current
    if (!surface || !box) return
    const alive = { current: true }
    const cleanup: { run: (() => void) | null } = { run: null }

    // Built only as the section nears the screen: its big atlas shouldn't hold up the hero's opening.
    // It's drawn from the display face, so it waits for that too.
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      near.disconnect()
      void document.fonts.load('400 120px "Host Grotesk"', 'HACK').then(build)
    }, { rootMargin: '100% 0px' })
    near.observe(box)

    const build = () => {
      if (!alive.current) return
      const field = createWakeField(surface, EVENT_LEDGER.words, () => setFailed(true))
      if (!field) {
        setFailed(true)
        return
      }
      const still = reducedMotion()
      const state = { stop: null as (() => void) | null, onScreen: false, visible: !document.hidden }

      const start = () => {
        if (state.stop || still || !state.onScreen || !state.visible) return
        state.stop = onFrame((now) => {
          if (!field.frame(now) && !state.onScreen) stop()
        })
      }
      const stop = () => {
        state.stop?.()
        state.stop = null
      }
      const scrolled = () => field.scrolled(-box.getBoundingClientRect().top)

      const sizes = new ResizeObserver(() => {
        field.resize(surface.clientWidth, surface.clientHeight)
        scrolled()
        field.frame(performance.now())
      })
      sizes.observe(surface)
      const screen = new IntersectionObserver(([entry]) => {
        state.onScreen = entry.isIntersecting
        if (entry.isIntersecting) start()
        else stop()
      })
      screen.observe(box)

      const onScroll = () => {
        scrolled()
        if (still) field.frame(performance.now())
      }
      // The cursor's own wake is off here: the site-wide ASCII trail (see Layout) is the drag now.
      const onVisibility = () => {
        state.visible = !document.hidden
        if (state.visible) start()
        else stop()
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)
      cleanup.run = () => {
        stop()
        sizes.disconnect()
        screen.disconnect()
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', onVisibility)
        field.destroy()
      }
    }

    return () => {
      alive.current = false
      near.disconnect()
      cleanup.run?.()
    }
  }, [section])

  if (failed) return null
  return (
    <div className={styles.stage} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
    </div>
  )
}

/** Proto's nights as a ledger, over giant words that catch colour in the cursor's wake. */
export function EventLedger({ events }: { events: readonly ProtoEvent[] }) {
  const section = useRef<HTMLElement>(null)
  const head = useRef<HTMLElement>(null)
  const frames = useRef(new Map<number, HTMLElement>())
  const [raised, setRaised] = useState<number | null>(null)
  const [broken, setBroken] = useState<ReadonlySet<number>>(() => new Set())
  const groups = byKind(events)

  /** Raises a night's photo beside its row: on screen if it can be, and clear of the heading and the section's fades. */
  const raise = (id: number, row: HTMLElement) => {
    const frame = frames.current.get(id)
    if (!frame || !section.current || !head.current) return
    const box = section.current.getBoundingClientRect()
    const rowBox = row.getBoundingClientRect()
    const height = frame.offsetHeight
    const onScreen = Math.max(NAV_CLEARANCE, Math.min(rowBox.top + (rowBox.height - height) / 2, window.innerHeight - height - SCREEN_MARGIN))
    const lowest = box.height - parseFloat(getComputedStyle(section.current).paddingBottom) - height
    const highest = head.current.getBoundingClientRect().bottom - box.top
    frame.style.top = `${Math.max(highest, Math.min(onScreen - box.top, lowest))}px`
    setRaised(id)
  }
  const lower = (id: number) => setRaised((current) => (current === id ? null : current))

  return (
    <section ref={section} className={styles.section} aria-labelledby="event-ledger">
      <WakeStage section={section} />
      <div className={styles.body}>
        <header ref={head} className={styles.head}>
          <h2 id="event-ledger" className={styles.title}>
            <MaskLines text={EVENT_LEDGER.title} />
          </h2>
          <p className={styles.count} data-reveal="rise">
            <span className={styles.icon} aria-hidden="true">
              {'○>_'}
            </span>
            <span className={styles.number}>{String(events.length).padStart(2, '0')}</span>
          </p>
        </header>
        {groups.length === 0 ? (
          <p className={styles.empty}>{EVENT_LEDGER.empty}</p>
        ) : (
          groups.map(([kind, nights]) => (
            <div key={kind} className={styles.group} data-hue={KIND_HUE[kind]}>
              <h3 className={styles.kind}>
                <span className={styles.glyph} aria-hidden="true">
                  {HUE_GLYPH[KIND_HUE[kind]]}
                </span>
                {kind}
              </h3>
              <ol className={styles.nights}>
                {nights.map((night) => {
                  const { month, day } = dateParts(night.date)
                  return (
                    <li key={night.id}>
                      <Link
                        className={styles.night}
                        data-past={daysUntil(night.date) < 0 || undefined}
                        to={`/events/${night.id}`}
                        onPointerEnter={(event) => {
                          if (event.pointerType !== 'touch') raise(night.id, event.currentTarget)
                        }}
                        onPointerLeave={() => lower(night.id)}
                        onFocus={(event) => {
                          if (event.currentTarget.matches(':focus-visible')) raise(night.id, event.currentTarget)
                        }}
                        onBlur={() => lower(night.id)}
                      >
                        <span className={styles.date}>
                          {month} {String(day).padStart(2, '0')}
                        </span>
                        <span className={styles.name}>{night.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))
        )}
      </div>
      {/* The titles are the rows' own text, so to a screen reader these photos add nothing. */}
      <div className={styles.photos} aria-hidden="true">
        {events.map((night) =>
          night.photo && !broken.has(night.id) ? (
            <div
              key={night.id}
              ref={(frame) => {
                if (frame) frames.current.set(night.id, frame)
                else frames.current.delete(night.id)
              }}
              className={styles.photo}
              data-hue={KIND_HUE[night.kind]}
              data-raised={raised === night.id || undefined}
            >
              <img
                src={coverUrl(night.photo)}
                alt=""
                loading="lazy"
                decoding="async"
                onLoad={(event) => {
                  // The frame takes the photo's shape, so a row raised before it loaded needs placing again.
                  const row = section.current?.querySelector<HTMLElement>(`a[href="/events/${night.id}"]`)
                  if (row && event.currentTarget.parentElement?.dataset.raised !== undefined) raise(night.id, row)
                }}
                onError={() => setBroken((failed) => new Set(failed).add(night.id))}
              />
            </div>
          ) : null,
        )}
      </div>
    </section>
  )
}
