import type { CSSProperties } from 'react'
import { BRAND } from '../content/site'
import ui from './ui.module.css'
import styles from './Logo.module.css'

/**
 * The Proto logo: the mark and "Proto" set in Satoshi Bold, from the logo pack (public/brand). It's
 * cut out of the text colour, so it follows whatever it sits on. Its height is set in `em`, so it
 * grows with the font size of the place it's used in.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <span
        className={`${styles.logo} ${className ?? ''}`}
        style={{ '--logo': `url(${BRAND.logo})` } as CSSProperties}
        aria-hidden="true"
      />
      <span className={ui.srOnly}>{BRAND.name}</span>
    </>
  )
}
