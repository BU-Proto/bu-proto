// Adapted from Marquee in Magic UI (https://github.com/magicuidesign/magicui), MIT License,
// Copyright (c) 2023 Magic UI. Ported from Tailwind to a CSS module.

import { Fragment, type CSSProperties, type ReactNode } from 'react'
import styles from './motion.module.css'

interface MarqueeProps {
  children: ReactNode
  /** Seconds per loop. */
  duration?: number
  reverse?: boolean
  /** Copies of the content in each half of the loop, so a short list still fills the width. */
  repeat?: number
  label: string
}

/**
 * A band that scrolls sideways forever and pauses on hover. The content renders twice so the
 * loop is seamless; the copy is hidden from screen readers. Static and wrapped under reduced motion.
 */
export function Marquee({ children, duration = 40, reverse = false, repeat = 1, label }: MarqueeProps) {
  const copies = Array.from({ length: repeat }, (_, index) => <Fragment key={index}>{children}</Fragment>)
  return (
    <div
      className={styles.marquee}
      style={{ '--duration': `${duration}s` } as CSSProperties}
      data-reverse={reverse || undefined}
      role="region"
      aria-label={label}
    >
      <div className={styles.marqueeTrack}>{copies}</div>
      <div className={styles.marqueeTrack} aria-hidden="true">
        {copies}
      </div>
    </div>
  )
}
