import { useLoaderData } from 'react-router'
import {
  AsideSection,
  DetailGallery,
  DetailLoadError,
  DetailNav,
  DetailOpener,
  DetailPage,
  DetailTitle,
  PeopleList,
  Prose,
  WriteUp,
  WriteUpSection,
} from '../components/DetailPage'
import detail from '../components/DetailPage.module.css'
import ui from '../components/ui.module.css'
import { BRAND } from '../content/site'
import { WIN_DETAIL, WIN_NOT_FOUND } from '../content/wins'
import type { WinPageData } from '../lib/content'
import { formatMonth } from '../lib/dates'
import { filled, neighboursOf } from '../lib/detail'
import styles from './WinDetail.module.css'

/** A win's project page: the cover, then the write-up, the team, the stack and the photos. */
export function WinDetail() {
  const { win, wins } = useLoaderData<WinPageData>()
  const { previous, next } = neighboursOf(wins, win.id)

  // BU teammates first, then everyone else in the team's own order (the sort is stable).
  const team = [...(win.team ?? [])].sort((a, b) => Number(Boolean(b.bu)) - Number(Boolean(a.bu)))
  const stack = win.stack ?? []
  const hasAside = team.length > 0 || stack.length > 0 || filled(win.funding)

  return (
    <DetailPage>
      <title>{`${win.project} · ${BRAND.full}`}</title>

      <DetailOpener photo={win.photo} alt={`${win.project} at ${win.event}`}>
        <p className={detail.kicker} data-fog-clear>
          {win.placement}
          {filled(win.track) && (
            <span className={detail.kickerNote} data-fog-clear>
              {win.track}
            </span>
          )}
        </p>
        <DetailTitle sample={win.placeholder}>{win.project}</DetailTitle>
        {filled(win.blurb) && (
          <p className={detail.lede} data-fog-clear>
            {win.blurb}
          </p>
        )}
        <p className={detail.note} data-fog-clear>
          {win.event}
          {win.date && `, ${formatMonth(win.date)}`}
        </p>
        {(win.github || win.devpost) && (
          <div className={detail.actions}>
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
      </DetailOpener>

      <WriteUp
        main={
          (filled(win.description) || filled(win.nextSteps)) && (
            <>
              {filled(win.description) && (
                <WriteUpSection id="built" title={WIN_DETAIL.built}>
                  <Prose text={win.description} />
                </WriteUpSection>
              )}
              {/* The story's last chapter, inside the same sheet rather than a box of its own. */}
              {filled(win.nextSteps) && (
                <WriteUpSection id="next-steps" title={WIN_DETAIL.nextSteps}>
                  <Prose text={win.nextSteps} />
                </WriteUpSection>
              )}
            </>
          )
        }
        aside={
          hasAside && (
            <>
              {team.length > 0 && (
                <AsideSection id="team" title={WIN_DETAIL.team}>
                  <PeopleList people={team} />
                </AsideSection>
              )}

              {stack.length > 0 && (
                <AsideSection id="stack" title={WIN_DETAIL.stack}>
                  <ul className={styles.stack}>
                    {stack.map((tech, i) => (
                      <li key={`${tech}-${i}`} data-fog-clear>
                        {tech}
                      </li>
                    ))}
                  </ul>
                </AsideSection>
              )}

              {filled(win.funding) && (
                <AsideSection id="funding" title={WIN_DETAIL.funding}>
                  <p className={styles.funding} data-fog-clear>
                    {win.funding}
                  </p>
                </AsideSection>
              )}
            </>
          )
        }
      />

      <DetailGallery title={WIN_DETAIL.gallery} images={win.gallery ?? []} label={win.project} />

      <DetailNav
        label="More wins"
        previousLabel={WIN_DETAIL.previous}
        nextLabel={WIN_DETAIL.next}
        previous={previous && { to: `/wins/${previous.id}`, name: previous.project, meta: previous.placement }}
        next={next && { to: `/wins/${next.id}`, name: next.project, meta: next.placement }}
        all={{ to: '/wins', label: WIN_DETAIL.allWins }}
      />
    </DetailPage>
  )
}

/** The route's ErrorBoundary: a win that isn't there gets a way back; anything else is LoadError. */
export function WinLoadError() {
  return <DetailLoadError copy={WIN_NOT_FOUND} to="/wins" />
}
