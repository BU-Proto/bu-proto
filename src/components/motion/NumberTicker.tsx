// Adapted from NumberTicker in Magic UI (https://github.com/magicuidesign/magicui), MIT License,
// Copyright (c) 2023 Magic UI. Rewritten without motion/react: a requestAnimationFrame ease-out.

import { useEffect, useState } from 'react'
import { reducedMotion, useInView } from '../../lib/useInView'

/** Counts from 0 up to `value` the first time it scrolls into view. */
export function NumberTicker({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [shown, setShown] = useState(() => (typeof window === 'undefined' || reducedMotion() ? value : 0))

  useEffect(() => {
    if (!inView) return
    // Under reduced motion the initial state is already the final text, and this never runs.
    if (reducedMotion()) return
    const frame = { id: 0 }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setShown(Math.round(value * (1 - (1 - t) ** 3)))
      if (t < 1) frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [inView, value, duration])

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {shown}
    </span>
  )
}
