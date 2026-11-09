// Smoother scrolling, kept out of the way of everything the browser already does well. Only a
// notched mouse wheel is eased: trackpads, touch, keys, the scrollbar, find-in-page and focus all
// scroll natively, and the page is still scrolled with window.scrollTo, so scroll listeners (the
// field's) and sticky elements see an ordinary scroll.

import { useEffect } from 'react'
import { reducedMotion } from './useInView'

/** Share of the remaining distance covered per 60Hz frame: about 450ms to settle. */
const EASE = 0.14
/** A trackpad's events within this long mark the device as a trackpad, so a stray big delta from
    one doesn't get eased. */
const TRACKPAD_HOLD_MS = 400

type LegacyWheel = WheelEvent & { wheelDeltaY?: number }

/**
 * A wheel with notches reports whole lines (Firefox) or the legacy ±120 per notch (Chromium and
 * Safari). Trackpads and Magic Mice send small, uneven pixel deltas with their own momentum.
 */
function isNotchedWheel(event: LegacyWheel): boolean {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return true
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return false
  const legacy = event.wheelDeltaY
  return typeof legacy === 'number' && legacy !== 0 && legacy % 120 === 0 && Math.abs(event.deltaY) >= 40
}

/** Whether something between the target and the page would scroll this wheel itself. */
function scrollsInside(target: EventTarget | null, deltaY: number): boolean {
  let node = target instanceof Element ? target : null
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.closest('[data-native-scroll]')) return true
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
      const atTop = node.scrollTop <= 0
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true
    }
    node = node.parentElement
  }
  return false
}

/** Page scroll is locked (an open menu sheet or dialog): leave the wheel alone. */
const scrollLocked = () =>
  getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden'

/*
 * One frame loop for everything drawn from the page's position. The wheel's glide moves the page
 * first in each frame, then the `onFrame` callbacks run, so they always see where the page is now
 * rather than where it was a frame ago.
 */
const frames = new Set<(time: number) => void>()
const loop: { id: number; glide: ((time: number) => void) | null } = { id: 0, glide: null }

function tick(time: number) {
  loop.id = 0
  const glide = loop.glide
  loop.glide = null
  glide?.(time)
  frames.forEach((frame) => frame(time))
  if (!loop.id && (loop.glide || frames.size > 0)) loop.id = requestAnimationFrame(tick)
}

const startLoop = () => {
  if (!loop.id) loop.id = requestAnimationFrame(tick)
}

/** Queues the glide's next step (or drops it, with null). Returns whether one is queued. */
function glideFrame(step: ((time: number) => void) | null): number {
  loop.glide = step
  if (step) startLoop()
  return step ? 1 : 0
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

/**
 * Eases a notched mouse wheel into a short glide, on fine pointers only, and never under reduced
 * motion. Anything else that moves the page mid-glide (a key, the scrollbar, find, focus, a link)
 * wins: the glide notices the page wasn't where it left it and lets go.
 */
export function useWheelEasing() {
  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let target = 0
    let current = 0
    let frame = 0
    let last = 0
    let trackpadUntil = 0

    const stop = () => {
      if (frame) glideFrame(null)
      frame = 0
    }

    const step = (now: number) => {
      // Someone else scrolled since the last frame: hand the page back to them.
      if (Math.abs(window.scrollY - current) > 2) return stop()
      const dt = Math.min(64, now - last)
      last = now
      current += (target - current) * (1 - (1 - EASE) ** (dt / 16.67))
      if (Math.abs(target - current) < 0.5) current = target
      window.scrollTo({ top: current, behavior: 'instant' })
      // The browser snaps to device pixels; anything further off means the page got shorter
      // under the glide, or something held it, so stop rather than chase an unreachable target.
      if (Math.abs(window.scrollY - current) > 2) return stop()
      frame = current === target ? 0 : glideFrame(step)
    }

    const onWheel = (event: LegacyWheel) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      if (!isNotchedWheel(event)) {
        trackpadUntil = event.timeStamp + TRACKPAD_HOLD_MS
        return stop()
      }
      if (event.timeStamp < trackpadUntil) return
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (scrollLocked() || scrollsInside(event.target, event.deltaY)) return

      const max = document.documentElement.scrollHeight - window.innerHeight
      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 40 : event.deltaY
      if (!frame) {
        current = window.scrollY
        target = current
        last = performance.now()
      }
      const next = Math.max(0, Math.min(max, target + delta))
      // At either end there's nothing to ease, and the browser's own overscroll should show.
      if (next === target) return
      event.preventDefault()
      target = next
      if (!frame) frame = glideFrame(step)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    // Any of these means the person is steering some other way now.
    window.addEventListener('keydown', stop, { passive: true })
    window.addEventListener('pointerdown', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    return () => {
      stop()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', stop)
      window.removeEventListener('pointerdown', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [])
}

/**
 * In-page links (#section on the same page) glide to their target. Only those: route changes
 * reset the scroll with window.scrollTo too, and a page that slid up to its top on every
 * navigation would be worse, so the CSS only switches smooth scrolling on around such a click.
 */
export function useSmoothAnchors() {
  useEffect(() => {
    if (reducedMotion()) return
    const root = document.documentElement
    let timer = 0
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const link = event.target instanceof Element ? event.target.closest('a[href*="#"]') : null
      if (!(link instanceof HTMLAnchorElement)) return
      const url = new URL(link.href, window.location.href)
      if (url.pathname !== window.location.pathname || url.origin !== window.location.origin || !url.hash) return
      root.setAttribute('data-smooth-scroll', '')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => root.removeAttribute('data-smooth-scroll'), 1200)
    }
    // Capture, so the attribute is on before the router (or the browser) scrolls to the target.
    document.addEventListener('click', onClick, { capture: true })
    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      window.clearTimeout(timer)
      root.removeAttribute('data-smooth-scroll')
    }
  }, [])
}
