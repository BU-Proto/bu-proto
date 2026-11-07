import { useEffect, type RefObject } from 'react'
import { useLocation } from 'react-router'
import { reducedMotion } from '../lib/useInView'

/** Springs for the plate's two edges. The edge in front runs stiff and the one behind runs loose, so it stretches like a gel. */
const LEADING = { stiffness: 620, damping: 34 }
const TRAILING = { stiffness: 300, damping: 27 }
/** Close enough to stop: the last fraction of a pixel isn't worth another frame. */
const AT_REST = 0.05
/** A pointer leaving for a moment shouldn't send the plate home and straight back. */
const LEAVE_DELAY = 90

interface Edge {
  at: number
  speed: number
  goal: number
}

function step(edge: Edge, spring: typeof LEADING, seconds: number) {
  edge.speed += (spring.stiffness * (edge.goal - edge.at) - spring.damping * edge.speed) * seconds
  edge.at += edge.speed * seconds
}

/**
 * One plate behind the tab's links. It rests on the page you're on, runs to whichever link the
 * pointer or keyboard is at, and stays put between neighbours, so it never blinks out as you move
 * along the tab. It keeps its speed if you change your mind mid-run, which a CSS transition can't.
 */
export function useNavPlate(nav: RefObject<HTMLElement | null>, plate: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation()

  useEffect(() => {
    const row = nav.current
    const shape = plate.current
    if (!row || !shape) return
    const still = reducedMotion()
    const left: Edge = { at: 0, speed: 0, goal: 0 }
    const right: Edge = { at: 0, speed: 0, goal: 0 }
    const state = { frame: 0, last: 0, timer: 0, shown: false, target: null as HTMLElement | null }

    const home = () => row.querySelector<HTMLElement>('[data-plate][aria-current="page"], [data-plate][data-current]')

    const paint = () => {
      shape.style.transform = `translate3d(${left.at.toFixed(2)}px, 0, 0)`
      shape.style.width = `${(right.at - left.at).toFixed(2)}px`
    }

    const run = (now: number) => {
      const seconds = Math.min((now - state.last) / 1000, 1 / 30)
      state.last = now
      const forward = right.goal + left.goal >= right.at + left.at
      // Two small steps a frame keep the stiff edge stable when a frame runs long.
      for (let pass = 0; pass < 2; pass++) {
        step(left, forward ? TRAILING : LEADING, seconds / 2)
        step(right, forward ? LEADING : TRAILING, seconds / 2)
      }
      paint()
      const settled = [left, right].every((edge) => Math.abs(edge.goal - edge.at) < AT_REST && Math.abs(edge.speed) < 1)
      if (settled) {
        left.at = left.goal
        right.at = right.goal
        paint()
        state.frame = 0
        return
      }
      state.frame = requestAnimationFrame(run)
    }

    const moveTo = (target: HTMLElement | null) => {
      state.target = target
      window.clearTimeout(state.timer)
      shape.toggleAttribute('data-shown', Boolean(target))
      if (!target) {
        state.shown = false
        return
      }
      // Measured against the row, since a menu's trigger sits inside its own positioned box.
      const start = row.getBoundingClientRect().left
      const box = target.getBoundingClientRect()
      left.goal = box.left - start
      right.goal = box.right - start
      // Nowhere to run from: it comes up in place.
      if (!state.shown || still) {
        cancelAnimationFrame(state.frame)
        state.frame = 0
        left.at = left.goal
        right.at = right.goal
        left.speed = 0
        right.speed = 0
        state.shown = true
        paint()
        return
      }
      if (!state.frame) {
        state.last = performance.now()
        state.frame = requestAnimationFrame(run)
      }
    }

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const target = (event.target as Element).closest<HTMLElement>('[data-plate]')
      if (target) moveTo(target)
    }
    const onLeave = () => {
      window.clearTimeout(state.timer)
      state.timer = window.setTimeout(() => moveTo(home()), LEAVE_DELAY)
    }
    const onFocus = (event: FocusEvent) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-plate]')
      if (target && (event.target as Element).matches(':focus-visible')) moveTo(target)
    }
    const onBlur = (event: FocusEvent) => {
      if (!row.contains(event.relatedTarget as Node | null)) moveTo(home())
    }
    const sizes = new ResizeObserver(() => moveTo(state.target ?? home()))

    moveTo(home())
    sizes.observe(row)
    row.addEventListener('pointerover', onOver)
    row.addEventListener('pointerleave', onLeave)
    row.addEventListener('focusin', onFocus)
    row.addEventListener('focusout', onBlur)
    return () => {
      cancelAnimationFrame(state.frame)
      window.clearTimeout(state.timer)
      sizes.disconnect()
      row.removeEventListener('pointerover', onOver)
      row.removeEventListener('pointerleave', onLeave)
      row.removeEventListener('focusin', onFocus)
      row.removeEventListener('focusout', onBlur)
    }
  }, [nav, plate, pathname])
}
