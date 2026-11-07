import type { CSSProperties } from 'react'
import styles from './Pixel.module.css'

/** Proto's seal in the current text colour. The file itself is drawn light, for dark grounds. */
export function ProtoMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`${styles.mark} ${className ?? ''}`}
      style={{ '--mark-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    />
  )
}
