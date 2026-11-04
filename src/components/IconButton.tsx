import type { ComponentProps } from 'react'
import { Link } from 'react-router'
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

interface IconLinkProps extends ComponentProps<typeof Link> {
  label: string
  variant?: Variant
}

/** The same round button, as a link to another page. */
export function IconLink({ label, variant = 'glass', className, children, ...rest }: IconLinkProps) {
  return (
    <Link
      aria-label={label}
      title={label}
      className={classesFor(variant, typeof className === 'string' ? className : undefined)}
      data-fog-clear="box"
      {...rest}
    >
      {children}
    </Link>
  )
}
