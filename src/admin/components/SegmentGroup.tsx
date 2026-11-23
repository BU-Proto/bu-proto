import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import ui from '../admin.module.css'

// A segmented control's frame: a group of `.tab` buttons (or links) with one indicator behind the
// picked one that slides from the last pick to the new one. The motion is trov's
// (web/src/segmented.ts): FLIP from the old box to the new, off under prefers-reduced-motion,
// and a control new to the screen doesn't slide in. The picked option is whichever child says so
// (aria-pressed or aria-current), so the options stay ordinary buttons the page writes itself.

interface Box {
  x: number
  y: number
  w: number
  h: number
}

const PICKED = ':scope > [aria-pressed="true"], :scope > [aria-current="page"], :scope > [aria-current="true"]'
const same = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function SegmentGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const groupRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  /** Where the indicator sits, and under which option. */
  const placed = useRef<{ on: HTMLElement; box: Box } | null>(null)

  function sync(slide: boolean) {
    const group = groupRef.current
    const indicator = indicatorRef.current
    if (!group || !indicator) return
    const on = group.querySelector<HTMLElement>(PICKED)
    // Hidden (a closed dialog), or nothing picked: the options draw themselves.
    if (!on || !on.offsetWidth) {
      group.removeAttribute('data-live')
      placed.current = null
      return
    }
    const next: Box = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight }
    const place = (box: Box) => {
      indicator.style.transform = `translate(${box.x}px, ${box.y}px)`
      indicator.style.width = `${box.w}px`
      indicator.style.height = `${box.h}px`
    }
    const prev = placed.current
    if (prev && same(prev.box, next)) {
      placed.current = { on, box: next }
      return
    }
    if (prev && prev.on !== on && slide && !reducedMotion()) {
      indicator.removeAttribute('data-sliding')
      place(prev.box)
      // Commit the old box before the transition starts.
      void indicator.offsetWidth
      indicator.setAttribute('data-sliding', '')
    }
    place(next)
    group.setAttribute('data-live', '')
    placed.current = { on, box: next }
  }

  // After every render: a new pick slides; the same pick at a new size (a count loaded) follows.
  useLayoutEffect(() => sync(true))

  // A resize, or the dialog it's in opening: follow without a slide.
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const observer = new ResizeObserver(() => sync(false))
    observer.observe(group)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={groupRef} className={className ? `${ui.tabs} ${className}` : ui.tabs} role="group" aria-label={label}>
      <span ref={indicatorRef} className={ui.tabIndicator} aria-hidden="true" onTransitionEnd={(event) => event.currentTarget.removeAttribute('data-sliding')} />
      {children}
    </div>
  )
}
