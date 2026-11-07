// The page's smooth scroll: Lenis, tuned to the feel of lusion.co. The page is still scrolled
// natively, so scroll listeners (the field's) and sticky elements see an ordinary scroll. Touch keeps
// its native momentum, and reduced motion gets no easing at all.

import Lenis from 'lenis'
import { useEffect } from 'react'
import { reducedMotion } from './useInView'

/** Lenis eases at 60 x this per second: a 80ms time constant, about 400ms to settle. */
const LERP = 0.208
/** The most one wheel event can move the page, so a hard flick stays a glide. */
const MAX_WHEEL_DELTA = 200

/** Page scroll is locked (an open menu sheet or dialog): leave the wheel alone. */
const scrollLocked = () =>
  getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden'

const frames = new Set<(time: number) => void>()
const loop: { lenis: Lenis | null; id: number } = { lenis: null, id: 0 }

function tick(time: number) {
  loop.lenis?.raf(time)
  frames.forEach((frame) => frame(time))
  loop.id = loop.lenis || frames.size > 0 ? requestAnimationFrame(tick) : 0
}

const startLoop = () => {
  if (!loop.id) loop.id = requestAnimationFrame(tick)
}

/**
 * Runs `frame` every frame, right after the page has scrolled for that frame, so anything drawn
 * from the page's position stays locked to it. Returns the way to stop.
 */
export function onFrame(frame: (time: number) => void) {
  frames.add(frame)
  startLoop()
  return () => {
    frames.delete(frame)
  }
}

/** Eases the wheel and trackpad, and has same-page anchor links glide to their target. */
export function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return
    const lenis = new Lenis({
      lerp: LERP,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      virtualScroll: (data) => {
        if (scrollLocked()) return false
        data.deltaY = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, data.deltaY))
        return true
      },
    })
    loop.lenis = lenis
    startLoop()
    return () => {
      loop.lenis = null
      lenis.destroy()
    }
  }, [])
}
