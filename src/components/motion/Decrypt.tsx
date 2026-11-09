// Adapted from DecryptedText in React Bits (https://github.com/DavidHDev/react-bits).
// Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0: use in an
// application or website is permitted; the components may not be sold or redistributed on their own.
// Rewritten without dependencies: the scramble uses the ASCII field's own glyphs and starts when
// the text scrolls into view.

import { useEffect, useState } from 'react'
import { reducedMotion, useInView } from '../../lib/useInView'
import styles from './motion.module.css'

const GLYPHS = '○>_.:;~=+*xo%#@'

/** A stable 0–1 value per character, so the reveal order looks random but never reshuffles. */
const jitter = (index: number) => {
  const x = Math.sin(index * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function scramble(text: string, progress: number, frame: number): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    // Each character settles somewhere in the run: earlier ones a little sooner.
    const settleAt = 0.15 + (i / Math.max(1, text.length)) * 0.55 + jitter(i) * 0.3
    out += char === ' ' || progress >= settleAt ? char : GLYPHS[(i * 7 + frame) % GLYPHS.length]!
  }
  return out
}

interface DecryptProps {
  text: string
  /** Milliseconds from the first glyph to the last letter. */
  duration?: number
}

/**
 * Text that resolves out of the field's glyphs the first time it's seen. Screen readers get the
 * real text straight away; the animation is hidden from them.
 */
export function Decrypt({ text, duration = 1100 }: DecryptProps) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [shown, setShown] = useState(() =>
    typeof window === 'undefined' || reducedMotion() ? text : scramble(text, 0, 0),
  )

  useEffect(() => {
    if (!inView) return
    // Under reduced motion the initial state is already the final text, and this never runs.
    if (reducedMotion()) return
    const frame = { id: 0 }
    const start = performance.now()
    const tick = (now: number) => {
      const progress = (now - start) / duration
      // The glyphs change every ~60ms rather than every frame, so it reads as type, not noise.
      setShown(progress >= 1 ? text : scramble(text, progress, Math.floor((now - start) / 60)))
      if (progress < 1) frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [inView, text, duration])

  return (
    <span ref={ref} className={styles.decrypt}>
      <span aria-hidden="true">{shown}</span>
      <span className={styles.srOnly}>{text}</span>
    </span>
  )
}
