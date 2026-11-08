import { useEffect, useRef, useState } from 'react'
import type { ShapeName } from '../ascii-field/shapes'
import { createHeroBloom } from '../lib/heroBloom'
import { GROUNDS } from '../lib/pageGround'
import { onFrame } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import styles from './Hero.module.css'

/**
 * The hero's ground: the field's blue-to-pink gradient, turning to type in its own light. It's drawn
 * for the eye alone, so screen readers skip it. Without WebGL2 it steps aside and the field stands in.
 * It takes the landing's shape unless a page asks for its own.
 */
export function HeroBloom({ shape = GROUNDS.home.field.shape }: { shape?: ShapeName }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const surface = canvas.current
    if (!surface) return
    const bloom = createHeroBloom(
      surface,
      shape,
      () => setFailed(true),
      () => {
        surface.dataset.ready = ''
      },
    )
    if (!bloom) {
      setFailed(true)
      return
    }
    const still = reducedMotion()
    const state = { onScreen: true, visible: !document.hidden, stop: null as (() => void) | null }

    const paint = () => bloom.frame(performance.now(), still)
    const sync = () => {
      const run = !still && state.onScreen && state.visible
      if (run && !state.stop) state.stop = onFrame(() => bloom.frame(performance.now(), false))
      else if (!run && state.stop) {
        state.stop()
        state.stop = null
      }
    }

    const measure = () => {
      const hero = surface.parentElement?.clientHeight ?? window.innerHeight
      bloom.resize(surface.clientWidth, surface.clientHeight, hero)
      paint()
    }
    const sizes = new ResizeObserver(measure)
    sizes.observe(surface)

    const screen = new IntersectionObserver(([entry]) => {
      state.onScreen = entry.isIntersecting
      sync()
    })
    screen.observe(surface)

    const onVisibility = () => {
      state.visible = !document.hidden
      sync()
    }
    const onScroll = () => {
      const hero = surface.parentElement?.clientHeight ?? window.innerHeight
      bloom.scrolled(Math.min(1, Math.max(0, window.scrollY / hero)))
      if (still) paint()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    sync()

    return () => {
      state.stop?.()
      sizes.disconnect()
      screen.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      bloom.destroy()
    }
  }, [shape])

  if (failed) return null
  return <canvas ref={canvas} className={styles.bloom} aria-hidden="true" data-trail-art />
}
