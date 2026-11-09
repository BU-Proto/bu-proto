import { Fragment } from 'react'
import type { Author } from '../content/guides/authors'
import { BuMark } from './BuMark'
import styles from './Byline.module.css'

/** A round author photo, or their initials when there's no photo. Decorative: the name says who. */
export function AuthorPhoto({ author, size = 'small' }: { author: Author; size?: 'small' | 'large' }) {
  const className = `${styles.photo} ${size === 'large' ? styles.large : ''}`
  if (!author.photo) {
    return (
      <span className={`${className} ${styles.initials}`} aria-hidden="true">
        {author.initials}
      </span>
    )
  }
  return <img className={className} src={author.photo} alt="" loading="lazy" width={64} height={64} />
}

/** An author's name, linking to their Devpost profile, with the BU mark after it. */
export function AuthorName({ author }: { author: Author }) {
  return (
    <>
      <a className={styles.name} href={author.href} target="_blank" rel="noopener noreferrer">
        {author.name}
      </a>
      {author.bu && <BuMark />}
    </>
  )
}

function monthYear(updated: string): string {
  const [year, month] = updated.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

interface BylineProps {
  authors: readonly Author[]
  /** `YYYY-MM`. */
  updated: string
  copy: { by: string; and: string; updated: string }
}

/** "By Andres Lopez and Jose Cruz", their photos overlapping before it, the date under it. */
export function Byline({ authors, updated, copy }: BylineProps) {
  return (
    <div className={styles.byline} data-fog-clear>
      <span className={styles.photos}>
        {authors.map((author) => (
          <AuthorPhoto key={author.href} author={author} />
        ))}
      </span>
      <span className={styles.text}>
        <span className={styles.names}>
          {copy.by}{' '}
          {authors.map((author, index) => (
            <Fragment key={author.href}>
              {index > 0 && (index === authors.length - 1 ? ` ${copy.and} ` : ', ')}
              <span className={styles.person}>
                <AuthorName author={author} />
              </span>
            </Fragment>
          ))}
        </span>
        <span className={styles.date}>
          {copy.updated} <time dateTime={updated}>{monthYear(updated)}</time>
        </span>
      </span>
    </div>
  )
}
