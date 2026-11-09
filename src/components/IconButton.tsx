import type { ComponentProps } from 'react'
import styles from './IconButton.module.css'

type Variant = 'glass' | 'solid'

const classesFor = (variant: Variant, className?: string) =>
  [styles.button, variant === 'solid' && styles.solid, className].filter(Boolean).join(' ')

interface IconButtonProps extends ComponentProps<'button'> {
  /** Accessible name, also shown as the tooltip. */
  label: string
  variant?: Variant
}

/** Round glass button for the top bar. The trail steps back from its whole box. */
export function IconButton({ label, variant = 'glass', className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={classesFor(variant, className)}
      data-fog-clear="box"
      {...rest}
    >
      {children}
    </button>
  )
}
