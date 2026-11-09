import styles from './BuMark.module.css'

/**
 * A small BU lettermark after a teammate's name, so visitors can see who on a team is from BU.
 * It's plain type in BU's red, not the university's trademarked logo.
 */
export function BuMark() {
  return (
    <abbr className={styles.mark} title="Boston University">
      BU
    </abbr>
  )
}
