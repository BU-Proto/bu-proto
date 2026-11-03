import type { ComponentProps } from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps extends ComponentProps<'button'> {
  /** Accessible name, also shown as the tooltip. */
  label: string
  variant?: 'glass' | 'solid'
}

/** Round glass button for the top bar. The trail steps back from its whole box. */
export function IconButton({ label, variant = 'glass', className, children, ...rest }: IconButtonProps) {
  const classes = [styles.button, variant === 'solid' && styles.solid, className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={classes}
      data-fog-clear="box"
      {...rest}
    >
      {children}
    </button>
  )
}
