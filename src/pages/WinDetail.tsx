import { isRouteErrorResponse, Link, useLoaderData, useRouteError } from 'react-router'
import type { Win } from '../../shared/api'
import { Gallery } from '../components/Gallery'
import { LoadError } from '../components/RouteStates'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BRAND } from '../content/site'
import { WIN_DETAIL, WIN_NOT_FOUND } from '../content/wins'
import { ApiError } from '../lib/api'
import type { WinPageData } from '../lib/content'
import styles from './WinDetail.module.css'

/** Rows stored before the project-page columns existed can still send null for the text fields. */
const filled = (value: string | null | undefined): value is string => Boolean(value?.trim())

/** Plain text with blank lines between paragraphs, as the portal stores it. */
const paragraphs = (value: string) =>
  value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

function Prose({ text }: { text: string }) {
  return (
    <div className={styles.prose}>
      {paragraphs(text).map((part, index) => (
        <p key={index} data-fog-clear>
          {part}
        </p>
      ))}
    </div>
  )
}

/** A win's project page: the cover, then the write-up, the team, the stack and the photos. */
export function WinDetail() {
  const { win, wins } = useLoaderData<WinPageData>()
  const index = wins.findIndex((other) => other.id === win.id)
  const previous = index > 0 ? wins[index - 1] : undefined
  const next = index >= 0 ? wins[index + 1] : undefined

  const team = win.team ?? []
  const stack = win.stack ?? []
  const gallery = win.gallery ?? []
  const hasAside = team.length > 0 || stack.length > 0 || filled(win.funding)

  return (
    <article className={styles.page}>
      <title>{`${win.project} · ${BRAND.full}`}</title>

      <Opener win={win} />

      {(filled(win.description) || hasAside) && (
        <div className={`${ui.panelDeep} ${styles.sheet}`}>
          {filled(win.description) && (
            <section className={styles.built} aria-labelledby="built">
              <h2 id="built" className={ui.sectionTitle} data-fog-clear>
                {WIN_DETAIL.built}
              </h2>
              <Prose text={win.description} />
            </section>
          )}

          {hasAside && (
            <div className={styles.aside}>
              {team.length > 0 && (
                <section aria-labelledby="team">
                  <h2 id="team" className={styles.asideTitle} data-fog-clear>
                    {WIN_DETAIL.team}
                  </h2>
                  <ul className={styles.team}>
                    {team.map((person, i) => (
                      <li key={`${person.name}-${i}`}>
                        {person.href ? (
                          <a className={styles.person} href={person.href} target="_blank" rel="noopener noreferrer" data-fog-clear>
                            {person.name}
                            <span className={styles.arrow} aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <span data-fog-clear>{person.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {stack.length > 0 && (
                <section aria-labelledby="stack">
                  <h2 id="stack" className={styles.asideTitle} data-fog-clear>
                    {WIN_DETAIL.stack}
                  </h2>
                  <ul className={styles.stack}>
                    {stack.map((tech, i) => (
                      <li key={`${tech}-${i}`} data-fog-clear>
                        {tech}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {filled(win.funding) && (
                <section aria-labelledby="funding">
                  <h2 id="funding" className={styles.asideTitle} data-fog-clear>
                    {WIN_DETAIL.funding}
                  </h2>
                  <p className={styles.funding} data-fog-clear>
                    {win.funding}
                  </p>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {gallery.length > 0 && (
        <section className={styles.gallery} aria-labelledby="gallery">
          <h2 id="gallery" className={ui.sectionTitle} data-fog-clear>
            {WIN_DETAIL.gallery}
          </h2>
          <Gallery images={gallery} label={win.project} />
        </section>
      )}

      {filled(win.nextSteps) && (
        <section className={`${ui.panelDeep} ${styles.nextSteps}`} aria-labelledby="next-steps">
          <h2 id="next-steps" className={ui.sectionTitle} data-fog-clear>
            {WIN_DETAIL.nextSteps}
          </h2>
          <Prose text={win.nextSteps} />
        </section>
      )}

      <nav className={`${ui.panelDeep} ${styles.neighbours}`} aria-label="More wins">
        {previous ? <Neighbour win={previous} label={WIN_DETAIL.previous} direction="previous" /> : <span />}
        <Link className={`${ui.textLink} ${styles.allWins}`} to="/wins" data-fog-clear>
          {WIN_DETAIL.allWins}
        </Link>
        {next ? <Neighbour win={next} label={WIN_DETAIL.next} direction="next" /> : <span />}
      </nav>
    </article>
  )
}

/** The first screen: the cover photo edge to edge, or the name set huge on the field when there's none. */
function Opener({ win }: { win: Win }) {
  const photo = win.photo
  return (
    <header className={`${styles.opener} ${photo ? styles.withPhoto : styles.typeOnly}`}>
      {photo && (
        <div className={styles.cover}>
          <img src={photo} alt={`${win.project} at ${win.event}`} fetchPriority="high" />
        </div>
      )}
      <div className={styles.openerText}>
        <p className={styles.placement} data-fog-clear>
          {win.placement}
          {filled(win.track) && (
            <span className={styles.track} data-fog-clear>
              {win.track}
            </span>
          )}
        </p>
        <h1 className={styles.project} data-fog-clear>
          {win.project}
          <SampleTag show={win.placeholder} />
        </h1>
        {filled(win.blurb) && (
          <p className={styles.blurb} data-fog-clear>
            {win.blurb}
          </p>
        )}
        <p className={styles.event} data-fog-clear>
          {win.event}
        </p>
        {(win.github || win.devpost) && (
          <div className={styles.actions}>
            {win.devpost && (
              <a className={ui.primary} href={win.devpost} target="_blank" rel="noopener noreferrer" data-fog-clear="box">
                {WIN_DETAIL.devpost} <span aria-hidden="true">↗</span>
              </a>
            )}
            {win.github && (
              <a className={ui.secondary} href={win.github} target="_blank" rel="noopener noreferrer" data-fog-clear="box">
                {WIN_DETAIL.github} <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function Neighbour({ win, label, direction }: { win: Win; label: string; direction: 'previous' | 'next' }) {
  return (
    <Link className={`${styles.neighbour} ${direction === 'next' ? styles.toNext : ''}`} to={`/wins/${win.id}`} data-fog-clear>
      <span className={styles.neighbourLabel}>
        {direction === 'previous' && <span aria-hidden="true">← </span>}
        {label}
        {direction === 'next' && <span aria-hidden="true"> →</span>}
      </span>
      <span className={styles.neighbourName}>{win.project}</span>
      <span className={styles.neighbourMeta}>{win.placement}</span>
    </Link>
  )
}

/** The route's ErrorBoundary: a win that isn't there gets a way back; anything else is LoadError. */
export function WinLoadError() {
  const error = useRouteError()
  const missing = (error instanceof ApiError && error.status === 404) || (isRouteErrorResponse(error) && error.status === 404)
  if (!missing) return <LoadError />

  return (
    <div className={ui.page}>
      <title>{`${WIN_NOT_FOUND.title} · ${BRAND.full}`}</title>
      <section className={styles.missing}>
        <h1 className={ui.introTitle} data-fog-clear>
          {WIN_NOT_FOUND.title}
        </h1>
        <p className={ui.introLede} data-fog-clear>
          {WIN_NOT_FOUND.text}
        </p>
        <Link className={ui.primary} to="/wins" data-fog-clear="box">
          {WIN_NOT_FOUND.back}
        </Link>
      </section>
    </div>
  )
}
