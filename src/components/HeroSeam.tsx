import { useEffect, useRef, type RefObject } from 'react'
import { createGlyphSeam } from '../lib/glyphSeam'
import { tileFor } from '../lib/ringField'
import { reducedMotion } from '../lib/useInView'
import styles from './Hero.module.css'

/** How often a few cells by the seam's line re-roll, in ms. */
const GLITCH_MS = 120

/**
 * Where the hero's rings give way to the page (see glyphSeam): a band of text cells over the hero's
 * foot and the gap below it, the light breaking off along a wandering line that scrolling moves. The
 * hero's own words keep their cells plain. Drawn for the eye alone; under reduced motion it holds
 * still.
 */
export function HeroSeam({ hero }: { hero: RefObject<HTMLElement | null> }) {
  const band = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const box = band.current
    const surface = canvas.current
    const section = hero.current
    if (!box || !surface || !section) return
    const seam = createGlyphSeam(surface)
    if (!seam) return
    const still = reducedMotion()
    const state = { alive: true, fonts: false, onScreen: false, visible: !document.hidden, timer: 0, frame: 0 }

    // 0 as the band's top comes up the screen, 1 as its bottom leaves; held halfway under reduced motion.
    const crossed = () => {
      if (still) return 0.5
      const rect = box.getBoundingClientRect()
      return Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))
    }
    const measure = () => {
      const origin = box.getBoundingClientRect()
      const words = [...section.querySelectorAll<HTMLElement>('[data-ring-clear]')].map((element) => {
        const rect = element.getBoundingClientRect()
        return new DOMRect(rect.left - origin.left, rect.top - origin.top, rect.width, rect.height)
      })
      seam.keepClear(words)
    }
    const build = () => {
      if (!state.alive || !state.fonts || box.clientWidth === 0) return
      seam.resize(box.clientWidth, box.clientHeight, crossed(), tileFor(box.clientWidth))
      measure()
      box.dataset.ready = ''
    }
    const sync = () => {
      const run = state.fonts && !still && state.onScreen && state.visible
      if (run && !state.timer) state.timer = window.setInterval(() => seam.glitch(), GLITCH_MS)
      else if (!run && state.timer) {
        window.clearInterval(state.timer)
        state.timer = 0
      }
    }

    const sizes = new ResizeObserver(build)
    sizes.observe(box)
    const screen = new IntersectionObserver(([entry]) => {
      state.onScreen = entry.isIntersecting
      if (state.onScreen) seam.scrolled(crossed())
      sync()
    })
    screen.observe(box)
    const onScroll = () => {
      if (still || !state.onScreen || state.frame) return
      state.frame = requestAnimationFrame(() => {
        state.frame = 0
        seam.scrolled(crossed())
      })
    }
    const onVisibility = () => {
      state.visible = !document.hidden
      sync()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    // The cells are set in the art face, and the hero's words reflow when the web fonts land.
    void Promise.all([document.fonts.load('500 10px "JetBrains Mono"'), document.fonts.ready]).then(() => {
      state.fonts = true
      build()
      sync()
    })

    return () => {
      state.alive = false
      window.clearInterval(state.timer)
      cancelAnimationFrame(state.frame)
      sizes.disconnect()
      screen.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [hero])

  return (
    <div ref={band} className={styles.seam} aria-hidden="true" data-seam>
      <canvas ref={canvas} />
    </div>
  )
}
