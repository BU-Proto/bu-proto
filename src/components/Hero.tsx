import { useEffect, useRef, useState } from 'react'
import { HERO_COPY } from '../content/home'
import { RevealWords } from './motion/RevealWords'
import styles from './Hero.module.css'

/**
 * The hero film: the launch cut, 1080p, silent, kept under Cloudflare's 25 MiB asset limit. A
 * phone's tall frame crops it to its middle.
 */
const FILM = { src: '/media/hero.mp4', poster: '/media/hero-poster-launch.jpg' }

/**
 * The home hero, one screen: a wide rounded frame holding the hero film, cropped to fill it edge
 * to edge, with what Proto is set under it. Everything round the frame is harbor. The film plays
 * muted and loops; under reduced motion it holds on its first frame.
 */
export function Hero() {
  const film = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const follow = () => setPaused(still.matches)
    still.addEventListener('change', follow)
    return () => still.removeEventListener('change', follow)
  }, [])

  useEffect(() => {
    const video = film.current
    if (!video) return
    if (paused) video.pause()
    else void video.play().catch(() => setPaused(true))
  }, [paused])

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        <video
          ref={film}
          className={styles.film}
          poster={FILM.poster}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
        >
          <source src={FILM.src} type="video/mp4" />
        </video>
      </div>
      <h1 className={styles.tagline} data-reveal="words">
        <RevealWords text={HERO_COPY.headline} />
      </h1>
    </section>
  )
}
