import type { ReactNode } from 'react'
import styles from './Kbd.module.css'

/** A key cap, for the shortcuts the portal shows beside the things they do. */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>
}
