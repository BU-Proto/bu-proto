import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { HERO_COPY, HERO_CURSORS, HERO_FILM, HERO_FILM_CONTROLS, type HeroFilm } from '../content/home'
import { useMediaQuery } from '../lib/useMediaQuery'
import { PauseIcon, PlayIcon } from './icons'
import { IconButton } from './IconButton'
import styles from './Hero.module.css'

const PHONE = '(max-width: 640px)'
const STILL = '(prefers-reduced-motion: reduce)'

/** Whether the visitor asked to save data: then the film waits for a tap instead of downloading. */
function savingData(): boolean {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
}

/**
 * The hero film in its frame: muted, looping, cropped to fill the frame. Phones get the film's tall
 * cut when it has one. Under reduced motion it holds on its poster and there's nothing to pause;
 * otherwise a button pauses it, since it moves on its own for longer than five seconds.
 */
function Film({ film }: { film: HeroFilm }) {
  const video = useRef<HTMLVideoElement>(null)
  const phone = useMediaQuery(PHONE)
  const still = useMediaQuery(STILL)
  const [paused, setPaused] = useState(savingData)
  const tall = phone && Boolean(film.phoneSrc)
  const src = tall && film.phoneSrc ? film.phoneSrc : film.src
  const playing = !paused && !still

  useEffect(() => {
    const node = video.current
    if (!node) return
    if (playing) void node.play().catch(() => setPaused(true))
    else node.pause()
  }, [playing, src])

  return (
    <div
      className={styles.frame}
      data-tall={tall || undefined}
      style={{ '--film-wide': film.aspect } as CSSProperties}
      data-fog-ignore
    >
      {/* A new source is a new element, so the browser drops the old download. */}
      <video
        key={src}
        ref={video}
        className={styles.film}
        src={src}
        poster={film.poster}
        muted
        loop
        playsInline
        preload={playing ? 'auto' : 'none'}
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      />
      {!still && (
        <IconButton
          className={styles.toggle}
          label={paused ? HERO_FILM_CONTROLS.play : HERO_FILM_CONTROLS.pause}
          aria-pressed={paused}
          onClick={() => setPaused((was) => !was)}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </IconButton>
      )}
    </div>
  )
}

/**
 * Collaborators' cursors drifting round the headline, as in a shared design file: a founder, an
 * engineer, a designer, all at work on the same thing. Each is a pointer and a name tag in its
 * own colour. Decoration only, so screen readers skip it; still under reduced motion.
 */
function Cursors() {
  return (
    <div className={styles.cursors} aria-hidden="true">
      {HERO_CURSORS.map((cursor, index) => (
        <span key={cursor.label} className={styles.cursor} data-tone={cursor.tone} data-n={index} data-fog-clear="box">
          <svg className={styles.pointer} viewBox="0 0 16 20">
            <path d="M1.5 1.5v14.6l3.9-3.5 2.6 5.9 2.7-1.2-2.6-5.8h5.2z" />
          </svg>
          <span className={styles.tag}>{cursor.label}</span>
        </span>
      ))}
    </div>
  )
}

/**
 * The home hero. With a film (content/home.ts), the film's frame sits over the field with what
 * Proto is set under it; without one, the field's light fills the screen and the line sits low on
 * it. The way in is in the top bar; the opening lead below says the rest.
 */
export function Hero() {
  return (
    <section className={styles.hero} data-film={HERO_FILM ? '' : undefined}>
      {HERO_FILM && <Film film={HERO_FILM} />}
      <div className={styles.copy}>
        <h1 className={styles.headline} data-fog-clear>
          {HERO_COPY.headline}
        </h1>
        <Cursors />
        {HERO_FILM?.note && (
          <p className={styles.note} data-fog-clear>
            {HERO_FILM.note}
          </p>
        )}
      </div>
    </section>
  )
}
