import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { HOME_FILM_CONTROLS, type HeroFilm } from '../content/home'
import { useInView } from '../lib/useInView'
import { useMediaQuery } from '../lib/useMediaQuery'
import { PauseIcon, PlayIcon } from './icons'
import { IconButton } from './IconButton'
import styles from './Film.module.css'

const PHONE = '(max-width: 640px)'
const STILL = '(prefers-reduced-motion: reduce)'

/** Whether the visitor asked to save data: then the film waits for a tap instead of downloading. */
function savingData(): boolean {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
}

/**
 * A film in its frame: muted, looping, cropped to fill the frame. It loads and plays only once it's
 * on screen, and stops when it scrolls away. Phones get the film's tall cut when it has one. Under
 * reduced motion it holds on its poster and there's nothing to pause; otherwise a button pauses
 * it, since it moves on its own for longer than five seconds.
 */
export function Film({ film }: { film: HeroFilm }) {
  const video = useRef<HTMLVideoElement>(null)
  // Once it's been on screen it keeps its source; it plays only while it's in view.
  const [frame, seen] = useInView<HTMLDivElement>('0px 0px 200px 0px')
  const [watched, inView] = useInView<HTMLDivElement>('0px', 0.25, true)
  const phone = useMediaQuery(PHONE)
  const still = useMediaQuery(STILL)
  const [paused, setPaused] = useState(savingData)
  const tall = phone && Boolean(film.phoneSrc)
  const src = tall && film.phoneSrc ? film.phoneSrc : film.src
  const playing = seen && inView && !paused && !still

  useEffect(() => {
    const node = video.current
    if (!node) return
    if (playing) void node.play().catch(() => setPaused(true))
    else node.pause()
  }, [playing, src])

  return (
    <div ref={frame} className={styles.frame} data-tall={tall || undefined} style={{ '--film-wide': film.aspect } as CSSProperties} data-fog-ignore>
      <span ref={watched} className={styles.watch} aria-hidden="true" />
      {/* A new source is a new element, so the browser drops the old download. */}
      <video
        key={src}
        ref={video}
        className={styles.film}
        src={seen ? src : undefined}
        poster={film.poster}
        muted
        loop
        playsInline
        preload={seen && !paused && !still ? 'auto' : 'none'}
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      />
      {!still && (
        <IconButton
          className={styles.toggle}
          label={paused ? HOME_FILM_CONTROLS.play : HOME_FILM_CONTROLS.pause}
          aria-pressed={paused}
          onClick={() => setPaused((was) => !was)}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </IconButton>
      )}
    </div>
  )
}
