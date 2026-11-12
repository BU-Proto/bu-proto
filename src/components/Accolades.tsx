import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_SHOWCASE } from '../content/wins'
import { accoladeOf, teamParts } from './accolade'
import { BuMark } from './BuMark'
import { SampleTag } from './SampleTag'
import styles from './Accolades.module.css'

type Level = 2 | 3

/** The cover, or the trail's glyphs when a win has no photo yet. */
function Cover({ win, alt, eager }: { win: Win; alt: string; eager?: boolean }) {
  if (win.photo) return <img src={win.photo} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  return (
    <span className={styles.noPhoto} aria-hidden="true">
      {'○ > _'}
    </span>
  )
}

/** The prize as the headline, with any placement pulled out of it set on its own line above. */
function Prize({ win, level, className }: { win: Win; level: Level; className: string }) {
  const { prize, rank } = accoladeOf(win)
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <Heading className={className} data-fog-clear>
      {rank && <span className={styles.rank}>{rank}, </span>}
      {prize}
    </Heading>
  )
}

/** "Built by Maya, Jordan and Priya", with the BU mark after each teammate from BU. */
function Team({ win, max }: { win: Win; max?: number }) {
  const parts = teamParts(win.team, max)
  if (parts.length === 0) return null
  return (
    <p className={styles.team} data-fog-clear>
      {WIN_SHOWCASE.builtBy}{' '}
      {parts.map((part, i) =>
        part.kind === 'name' ? (
          <span key={i} className={styles.member}>
            {part.text}
            {part.bu && <BuMark />}
          </span>
        ) : (
          part.text
        ),
      )}
    </p>
  )
}

/** The project's name, as the link into its page. */
function ProjectLink({ win, className }: { win: Win; className: string }) {
  return (
    <p className={className} data-fog-clear>
      <Link className={styles.name} to={`/wins/${win.id}`}>
        {win.project}
      </Link>
      <SampleTag show={win.placeholder} />
    </p>
  )
}

/**
 * A top placement: the cover framed on one side, at a size a screenshot survives, and the prize
 * set large on the other. `side` says which side the photo takes.
 */
export function AccoladeFeature({
  win,
  side = 'left',
  level = 2,
  eager = false,
}: {
  win: Win
  side?: 'left' | 'right'
  level?: Level
  eager?: boolean
}) {
  const { note, hackathon } = accoladeOf(win)
  return (
    <article className={styles.feature} data-side={side}>
      <Overlay win={win} />
      <div className={styles.featurePhoto}>
        <Cover win={win} alt={`${win.project} at ${hackathon}`} eager={eager} />
      </div>
      <div className={styles.featureText}>
        <Prize win={win} level={level} className={styles.featurePrize} />
        {note && (
          <p className={styles.featureNote} data-fog-clear>
            {note}
          </p>
        )}
        <p className={styles.featureWhere} data-fog-clear>
          {WIN_SHOWCASE.at} {hackathon}
        </p>
        <div className={styles.featureProject}>
          <ProjectLink win={win} className={styles.featureName} />
          {win.blurb && (
            <p className={styles.featureBlurb} data-fog-clear>
              {win.blurb}
            </p>
          )}
          <Team win={win} max={6} />
        </div>
      </div>
    </article>
  )
}

/**
 * The same link again, laid over the whole accolade so a click anywhere opens the project. Hidden
 * from screen readers and the tab order, which get the project name's link instead. Its own
 * element, not a stretched ::after, because the scroll reveal's translate would trap one.
 */
function Overlay({ win }: { win: Win }) {
  return <Link className={styles.overlay} to={`/wins/${win.id}`} tabIndex={-1} aria-hidden="true" />
}

/** A prize set smaller: the prize and where, then the cover, then the project. */
export function AccoladePlate({ win, level = 3 }: { win: Win; level?: Level }) {
  const { note, hackathon } = accoladeOf(win)
  return (
    <article className={styles.plate}>
      <Overlay win={win} />
      <div className={styles.platePhoto}>
        <Cover win={win} alt={`${win.project} at ${hackathon}`} />
      </div>
      <div className={styles.plateHead}>
        <Prize win={win} level={level} className={styles.platePrize} />
        <p className={styles.plateWhere} data-fog-clear>
          {note && <span className={styles.plateNote}>{note}</span>}
          {WIN_SHOWCASE.at} {hackathon}
        </p>
      </div>
      <div className={styles.plateText}>
        <ProjectLink win={win} className={styles.plateName} />
        {win.blurb && (
          <p className={styles.plateBlurb} data-fog-clear>
            {win.blurb}
          </p>
        )}
      </div>
      {/* Always there, so every card keeps the same four rows. */}
      <div className={styles.plateTeam}>
        <Team win={win} />
      </div>
    </article>
  )
}

/** Top placements, one after another, the photo swapping sides each time. */
export function AccoladeFeatures({ wins, level = 2, eagerFirst = false }: { wins: readonly Win[]; level?: Level; eagerFirst?: boolean }) {
  return (
    <ol className={styles.features}>
      {wins.map((win, index) => (
        <li key={win.id}>
          <AccoladeFeature win={win} level={level} side={index % 2 ? 'right' : 'left'} eager={eagerFirst && index === 0} />
        </li>
      ))}
    </ol>
  )
}

/** Prizes as even cards, three across (two on tablets, one on phones), their parts lined up by row. */
export function AccoladePlates({ wins, level = 3 }: { wins: readonly Win[]; level?: Level }) {
  return (
    <ul className={styles.plates}>
      {wins.map((win) => (
        <li key={win.id}>
          <AccoladePlate win={win} level={level} />
        </li>
      ))}
    </ul>
  )
}
