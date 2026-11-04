// Adapted from ScrollReveal in React Bits (https://github.com/DavidHDev/react-bits).
// Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0: use in an
// application or website is permitted; the components may not be sold or redistributed on their own.
// Rewritten without GSAP: each word runs on a CSS scroll-driven animation (animation-timeline:
// view()), so it costs nothing on the main thread. Browsers without it show the text as is.

import type { CSSProperties } from 'react'
import styles from './motion.module.css'

/** Words that light up one after another as the line scrolls up the screen. */
export function ScrubWords({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span key={index} className={styles.word} style={{ '--i': index } as CSSProperties}>
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </>
  )
}
