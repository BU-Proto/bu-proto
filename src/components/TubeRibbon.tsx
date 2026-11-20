import { useEffect, useId, useRef } from 'react'
import { onFrame } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import styles from './TubeRibbon.module.css'

/** Share of the remaining distance the head covers per 60Hz frame. */
const EASE = 0.12
/** How far outside the viewport the ribbon still counts as on screen. */
const ROOT_MARGIN = '50% 0px 50% 0px'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export interface TubeRibbonProps {
  /** SVG path data in the coordinate space of `box`. */
  path: string
  /** The path's coordinate space, [width, height]. x maps 0..width onto the element's full width; y uses the same scale, from the element's top. */
  box: readonly [number, number]
  /** Tube thickness in `box` units. */
  thickness: number
  /** Viewport line the drawing follows, as a fraction of viewport height: the ribbon starts as the curve's top rises past that line and is whole once its bottom has, evenly in between. */
  lead?: number
  className?: string
}

/**
 * Lusion's blue ribbon: a solid, softly lit tube along a curve, its round head drawing forward as
 * the page scrolls. Blue deepens toward the top left, where it comes in, and lifts toward
 * periwinkle as it runs down and right; a soft streak along its middle makes it read as round.
 */
export function TubeRibbon({ path, box, thickness, lead = 0.72, className }: TubeRibbonProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<SVGPathElement>(null)
  const shineRef = useRef<SVGPathElement>(null)
  const gradient = `tube-${useId().replace(/:/g, '')}`
  const [width, height] = box

  useEffect(() => {
    const root = rootRef.current
    const body = bodyRef.current
    const shine = shineRef.current
    if (!root || !body || !shine) return

    const still = reducedMotion()
    const state = { shown: still ? 1 : 0, last: 0, onScreen: false, stop: null as (() => void) | null }

    const show = (progress: number) => {
      const offset = String(1 - progress)
      body.style.strokeDashoffset = offset
      shine.style.strokeDashoffset = offset
      // A dash of no length still paints its round cap: keep the dot away until there's a line.
      root.style.visibility = progress < 0.002 ? 'hidden' : ''
    }

    /** How much of the curve should be drawn for where the page is: linear over the curve's height. */
    const goal = () => {
      if (still) return 1
      const scale = root.clientWidth / width
      const bounds = body.getBBox()
      const top = root.getBoundingClientRect().top + bounds.y * scale
      return clamp01((lead * window.innerHeight - top) / Math.max(1, bounds.height * scale))
    }

    const sleep = () => {
      state.stop?.()
      state.stop = null
    }

    const frame = (time: number) => {
      const target = goal()
      const dt = state.last ? Math.min(64, time - state.last) : 16.67
      state.last = time
      state.shown += (target - state.shown) * (1 - (1 - EASE) ** (dt / 16.67))
      if (Math.abs(target - state.shown) < 0.0004) state.shown = target
      show(state.shown)
      if (state.shown === target) sleep()
    }

    const wake = () => {
      if (state.stop || still || !state.onScreen) return
      state.last = 0
      state.stop = onFrame(frame)
    }

    state.shown = goal()
    show(state.shown)
    if (still) return

    const visible = new IntersectionObserver(
      (entries) => {
        const onScreen = entries.at(-1)?.isIntersecting ?? false
        if (onScreen === state.onScreen) return
        state.onScreen = onScreen
        // Out of sight either way: level with the page, there's no glide to show.
        state.shown = goal()
        show(state.shown)
        if (onScreen) wake()
        else sleep()
      },
      { rootMargin: ROOT_MARGIN },
    )
    visible.observe(root)
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake, { passive: true })

    return () => {
      sleep()
      visible.disconnect()
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', wake)
    }
  }, [path, width, lead])

  return (
    <div ref={rootRef} className={className ? `${styles.ribbon} ${className}` : styles.ribbon} aria-hidden="true">
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} focusable="false">
        <defs>
          <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width * 0.75} y2={width * 0.75}>
            <stop offset="0" stopColor="#3330e4" />
            <stop offset="0.55" stopColor="#4a5cee" />
            <stop offset="1" stopColor="#5f80f6" />
          </linearGradient>
        </defs>
        <path ref={bodyRef} className={styles.body} d={path} stroke={`url(#${gradient})`} strokeWidth={thickness} pathLength={1} />
        <path ref={shineRef} className={styles.shine} d={path} strokeWidth={thickness * 0.34} pathLength={1} />
      </svg>
    </div>
  )
}
