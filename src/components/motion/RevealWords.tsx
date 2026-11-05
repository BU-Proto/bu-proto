import type { CSSProperties } from 'react'
import styles from './motion.module.css'

/**
 * A title whose words rise into place one after another when its `data-reveal="words"` parent
 * comes into view (see useReveal). The words stay plain text, so the heading reads as is.
 */
export function RevealWords({ text }: { text: string }) {
  const words = text.split(' ')
  return words.map((word, index) => (
    <span key={index} className={styles.revealWord} style={{ '--i': index } as CSSProperties}>
      {word}
      {index < words.length - 1 ? ' ' : ''}
    </span>
  ))
}
