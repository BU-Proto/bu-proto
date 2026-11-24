import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TRACKS, TRACKS_INTRO, type Track } from '../content/home'
import { reducedMotion, useInView } from '../lib/useInView'
import styles from './WaysIn.module.css'

/**
 * Each way's flat drawing, in its tile's ink: a sprout for Start, stacked blocks for Build, a
 * rocket for Launch. Bold, geometric shapes in one colour, after brand.dropbox.com's pictograms.
 */
/** A track's drawing; the About page shows it too, smaller. */
export function TrackPicture({ name, className }: { name: Track['picture']; className?: string }) {
  const common = { className: className ?? styles.picture, viewBox: '0 0 120 120', fill: 'currentColor', 'aria-hidden': true, focusable: false } as const
  if (name === 'sprout') {
    return (
      <svg {...common}>
        <rect x="55" y="50" width="10" height="58" rx="5" />
        <path d="M60 70C38 70 20 56 16 30c26 0 42 14 44 40z" />
        <path d="M60 56c6-24 24-38 46-38-2 26-20 40-46 38z" />
        <rect x="24" y="102" width="72" height="10" rx="5" />
      </svg>
    )
  }
  if (name === 'blocks') {
    return (
      <svg {...common}>
        <rect x="10" y="70" width="46" height="40" />
        <rect x="64" y="70" width="46" height="40" />
        <rect x="37" y="22" width="46" height="40" />
      </svg>
    )
  }
  return (
    <svg {...common} fillRule="evenodd">
      <path d="M60 6c20 15 27 44 21 76H39C33 50 40 21 60 6zm0 30a11 11 0 1 0 .01 0z" />
      <path d="M39 62 20 88l20-2zM81 62l19 26-20-2z" />
      <path d="M47 90h26l-13 24z" />
    </svg>
  )
}

/** Which way the page has reached: the panels open in turn as the section crosses the screen. */
function wayFromScroll(section: HTMLElement): number {
  const box = section.getBoundingClientRect()
  const through = (window.innerHeight - box.top) / (window.innerHeight + box.height)
  const reached = (through - 0.3) / 0.4
  return Math.min(TRACKS.length - 1, Math.max(0, Math.floor(reached * TRACKS.length)))
}

/**
 * The three ways in: three colour tiles side by side, each in its size's light with ink of the
 * same hue, and a flat drawing at its foot. The way the page has reached opens wider, and so does
 * the one under the pointer. All the words are always there; opening a tile only gives it more
 * room. On phones the tiles stack.
 */
export function WaysIn() {
  const [ref, inView] = useInView<HTMLElement>('0px 0px -15% 0px')
  const section = useRef<HTMLElement | null>(null)
  const [reached, setReached] = useState(0)
  const [pointed, setPointed] = useState<number | null>(null)
  const open = pointed ?? reached

  useEffect(() => {
    if (reducedMotion()) return
    const update = () => {
      if (section.current) setReached(wayFromScroll(section.current))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <section
      ref={(node) => {
        ref.current = node
        section.current = node
      }}
      className={styles.ways}
      data-in={inView || undefined}
      aria-labelledby="tracks"
    >
      <header className={styles.head}>
        <h2 id="tracks" className={styles.title}>
          {TRACKS_INTRO.title}
        </h2>
        <p className={styles.lede}>{TRACKS_INTRO.lede}</p>
      </header>

      <ol className={styles.list}>
        {TRACKS.map((track, index) => (
          <li
            key={track.name}
            className={styles.way}
            data-tone={track.hue}
            data-open={index === open || undefined}
            style={{ '--i': index } as CSSProperties}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') setPointed(index)
            }}
            onPointerLeave={() => setPointed(null)}
          >
            <div className={styles.words}>
              <h3 className={styles.name}>{track.name}</h3>
              <p className={styles.who}>{track.who}</p>
              <ul className={styles.offers}>
                {track.offers.map((offer) => (
                  <li key={offer}>{offer}</li>
                ))}
              </ul>
            </div>
            <div className={styles.figure}>
              <TrackPicture name={track.picture} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
