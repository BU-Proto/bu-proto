import { Fragment, type CSSProperties } from 'react'
import styles from './motion.module.css'

/**
 * A title whose words rise into place one after another when its `data-reveal="words"` parent
 * comes into view (see useReveal). The words stay plain text, so the heading reads as is. The
 * spaces sit between the words' boxes, not inside them, where an inline-block would drop them.
 */
export function RevealWords({ text }: { text: string }) {
  const words = text.split(' ')
  return words.map((word, index) => (
    <Fragment key={index}>
      {index > 0 && ' '}
      <span className={styles.revealWord} style={{ '--i': index } as CSSProperties}>
        {word}
      </span>
    </Fragment>
  ))
}
