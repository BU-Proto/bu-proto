// The pieces every detail page is built from (/wins/:id, /events/:id, /hackathons/:id), so the
// three read as one family: the opener, the write-up sheet, the photos, the previous / next bar
// and the not-found state.

import type { ReactNode } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { BRAND } from '../content/site'
import { ApiError } from '../lib/api'
import { paragraphs } from '../lib/detail'
import { BuMark } from './BuMark'
import { Gallery } from './Gallery'
import { MaskLines } from './motion/MaskLines'
import motion from './motion/motion.module.css'
import { useReveal } from './motion/useReveal'
import { LoadError } from './RouteStates'
import { SampleTag } from './SampleTag'
import ui from './ui.module.css'
import styles from './DetailPage.module.css'

export function DetailPage({ children }: { children: ReactNode }) {
  const revealRef = useReveal<HTMLElement>()
  return (
    <article ref={revealRef} className={`${styles.page} ${motion.reveal}`}>
      {children}
    </article>
  )
}

/**
 * The first screen, built like the home hero: the cover photo from the very top of the page down
 * to the copy, or the name set large on the harbor ground when there's no photo. In the copy, the first child
 * and the title take the left column and everything else the right. `hugeName: false` keeps the
 * photo-size title without a photo, for names that run to a sentence (event titles).
 */
export function DetailOpener({
  photo,
  alt,
  hugeName = true,
  credit,
  children,
}: {
  photo: string | null | undefined
  alt: string
  hugeName?: boolean
  /** For a stock or default cover: who took it, under what licence, and where it's from. */
  credit?: { author: string; license: string; source: string }
  children: ReactNode
}) {
  const kind = photo ? styles.withPhoto : `${styles.typeOnly} ${hugeName ? styles.hugeName : ''}`
  return (
    <header className={`${styles.opener} ${kind}`}>
      {photo && (
        <div className={styles.cover}>
          <img src={photo} alt={alt} fetchPriority="high" />
        </div>
      )}
      {photo && credit && (
        <p className={styles.credit}>
          Photo by {credit.author},{' '}
          <a href={credit.source} target="_blank" rel="noopener noreferrer">
            {credit.license} via Wikimedia Commons
          </a>
        </p>
      )}
      <div className={styles.openerText}>
        <div className={styles.openerGrid}>{children}</div>
      </div>
    </header>
  )
}

export function DetailTitle({ children, sample }: { children: string; sample: boolean }) {
  return (
    <h1 className={styles.title}>
      <MaskLines text={children} delay={100} />
      <SampleTag show={sample} />
    </h1>
  )
}

/** Plain text with blank lines between paragraphs, as the portal stores it. */
export function Prose({ text }: { text: string }) {
  return (
    <div className={styles.prose}>
      {paragraphs(text).map((part, index) => (
        <p key={index}>
          {part}
        </p>
      ))}
    </div>
  )
}

/**
 * The write-up, as an editorial split: the side column (`aside`) on the left, pinned while the text
 * scrolls, and the main column (`main`) on the right. Either may be empty; with only one, it takes
 * the full width, and a main column on its own sets each section's title to the left of its text.
 */
export function WriteUp({ main, aside }: { main?: ReactNode; aside?: ReactNode }) {
  if (!main && !aside) return null
  return (
    <div className={styles.sheet}>
      {main && (
        <div className={styles.main} data-reveal>
          {main}
        </div>
      )}
      {aside && (
        <aside className={styles.aside} data-reveal>
          {aside}
        </aside>
      )}
    </div>
  )
}

/** A titled part of the write-up's main column. */
export function WriteUpSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={ui.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** A titled part of the side column. */
export function AsideSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={styles.asideTitle}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export interface Person {
  name: string
  href: string | null
  /** From BU: gets the BU mark after the name. Older rows don't have it. */
  bu?: boolean
}

/** A ruled list of names, each linking out when there's somewhere to go. */
export function PeopleList({ people }: { people: readonly Person[] }) {
  return (
    <ul className={styles.ruled}>
      {people.map((person, i) => (
        <li key={`${person.name}-${i}`}>
          {person.href ? <OutLink href={person.href}>{person.name}</OutLink> : <span>{person.name}</span>}
          {person.bu && <BuMark />}
        </li>
      ))}
    </ul>
  )
}

/** A link out of the site, set like a name with a small arrow after it. */
export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={styles.person} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

export function DetailGallery({ title, images, label }: { title: string; images: readonly string[]; label: string }) {
  if (images.length === 0) return null
  return (
    <section className={styles.gallery} aria-labelledby="gallery" data-reveal>
      <h2 id="gallery" className={ui.sectionTitle}>
        {title}
      </h2>
      <Gallery images={images} label={label} />
    </section>
  )
}

/** A ruled panel of its own, for a part that reads after the photos. */
export function DetailPanel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={`${ui.panelDeep} ${styles.panel}`} aria-labelledby={id} data-reveal>
      <h2 id={id} className={ui.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export interface Neighbour {
  to: string
  name: string
  meta: string
}

interface DetailNavProps {
  label: string
  previous?: Neighbour
  next?: Neighbour
  previousLabel: string
  nextLabel: string
  all: { to: string; label: string }
}

/** The bar at the foot of the page: the one before, the way back to the list, the one after. */
export function DetailNav({ label, previous, next, previousLabel, nextLabel, all }: DetailNavProps) {
  return (
    <nav className={styles.neighbours} aria-label={label} data-reveal>
      {previous ? <NeighbourLink item={previous} label={previousLabel} direction="previous" /> : <span />}
      <Link className={`${ui.textLink} ${styles.all}`} to={all.to}>
        {all.label}
      </Link>
      {next ? <NeighbourLink item={next} label={nextLabel} direction="next" /> : <span />}
    </nav>
  )
}

function NeighbourLink({ item, label, direction }: { item: Neighbour; label: string; direction: 'previous' | 'next' }) {
  return (
    <Link className={`${styles.neighbour} ${direction === 'next' ? styles.toNext : ''}`} to={item.to}>
      <span className={styles.neighbourLabel}>
        {direction === 'previous' && <span aria-hidden="true">← </span>}
        {label}
        {direction === 'next' && <span aria-hidden="true"> →</span>}
      </span>
      <span className={styles.neighbourName}>{item.name}</span>
      <span className={styles.neighbourMeta}>{item.meta}</span>
    </Link>
  )
}

export interface NotFoundCopy {
  title: string
  text: string
  back: string
}

/** A detail route's ErrorBoundary: a missing or unpublished row gets a way back; anything else is LoadError. */
export function DetailLoadError({ copy, to }: { copy: NotFoundCopy; to: string }) {
  const error = useRouteError()
  const missing = (error instanceof ApiError && error.status === 404) || (isRouteErrorResponse(error) && error.status === 404)
  if (!missing) return <LoadError />

  return (
    <div className={ui.page}>
      <title>{`${copy.title} · ${BRAND.full}`}</title>
      <section className={styles.missing}>
        <h1 className={ui.introTitle}>
          {copy.title}
        </h1>
        <p className={ui.introLede}>
          {copy.text}
        </p>
        <Link className={ui.primary} to={to}>
          {copy.back}
        </Link>
      </section>
    </div>
  )
}
