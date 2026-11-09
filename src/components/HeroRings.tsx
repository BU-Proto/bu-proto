import { useEffect, useRef, useState, type RefObject } from 'react'
import { createRingField } from '../lib/ringField'
import { onFrame } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import styles from './Hero.module.css'

/** Controls in the hero keep their own clicks: holding on them doesn't dive. */
const CONTROLS = 'a, button, input, select, textarea, label, [role="button"]'

/**
 * The hero's rings of block-shade type (see ringField). Whatever is marked [data-ring-clear], the hero's words and
 * Proto's mark in the top bar, keeps a clear space around it. Pressing and holding anywhere else spins
 * the rings up and dives into them, and a small label follows the pointer to say so. Drawn for the eye
 * alone; without WebGL2 the hero stands on the plain black.
 */
export function HeroRings({ hero }: { hero: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const surface = canvas.current
    const box = hero.current
    if (!surface || !box) return
    const field = createRingField(surface, () => setFailed(true))
    if (!field) {
      setFailed(true)
      return
    }
    const still = reducedMotion()
    const state = { stop: null as (() => void) | null, onScreen: true, visible: !document.hidden }

    const measure = () => {
      const origin = surface.getBoundingClientRect()
      const words = [...document.querySelectorAll<HTMLElement>('[data-ring-clear]')].map((element) => {
        const rect = element.getBoundingClientRect()
        return new DOMRect(rect.left - origin.left, rect.top - origin.top, rect.width, rect.height)
      })
      field.clear(words)
    }
    const paint = () => field.frame(performance.now(), still)
    const sync = () => {
      const run = !still && state.onScreen && state.visible
      if (run && !state.stop) state.stop = onFrame((now) => field.frame(now, false))
      else if (!run && state.stop) {
        state.stop()
        state.stop = null
      }
    }

    const sizes = new ResizeObserver(() => {
      // The seam's band (HeroSeam), for the light to gather above it.
      const seam = box.querySelector<HTMLElement>('[data-seam]')
      field.resize(surface.clientWidth, surface.clientHeight, box.clientHeight, seam?.clientHeight ?? 0)
      measure()
      paint()
      surface.dataset.ready = ''
    })
    sizes.observe(surface)
    const screen = new IntersectionObserver(([entry]) => {
      state.onScreen = entry.isIntersecting
      sync()
    })
    // The canvas, not the hero: it runs on below the hero's foot.
    screen.observe(surface)
    const onVisibility = () => {
      state.visible = !document.hidden
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)
    // The words reflow when the web fonts land.
    document.fonts?.ready.then(measure)
    // The top bar stays put while the hero scrolls under it, so its mark's clear space moves on the rings.
    const onScroll = () => {
      if (!state.onScreen) return
      measure()
      if (still) paint()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const release = () => field.hold(false)
    const onDown = (event: PointerEvent) => {
      if (still || event.button !== 0 || (event.target as Element).closest(CONTROLS)) return
      field.hold(true)
    }
    const onMove = (event: PointerEvent) => {
      const tag = label.current
      if (!tag || event.pointerType !== 'mouse') return
      const rect = box.getBoundingClientRect()
      const overControl = (event.target as Element).closest(CONTROLS) !== null
      tag.toggleAttribute('data-shown', !still && !overControl)
      tag.style.transform = `translate3d(${event.clientX - rect.left + 18}px, ${event.clientY - rect.top + 18}px, 0)`
    }
    const onLeave = () => {
      label.current?.removeAttribute('data-shown')
      release()
    }
    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointermove', onMove)
    box.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)

    sync()
    return () => {
      state.stop?.()
      sizes.disconnect()
      screen.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
      field.destroy()
    }
  }, [hero])

  if (failed) return null
  return (
    <>
      <canvas ref={canvas} className={styles.rings} aria-hidden="true" />
      <span ref={label} className={styles.hold} aria-hidden="true">
        Hold to dive
      </span>
    </>
  )
}
