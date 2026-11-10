import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import ui from '../components/ui.module.css'
import { BRAND } from '../content/site'
import {
  HUB_PATH,
  ORG_PAGE,
  orgHref,
  ORGS,
  PLAYBOOK_CARD,
  type Beat,
  type Org,
  type OrgPhoto,
  type Program,
} from '../content/resourcesHub'
import type { Hue, TrackName } from '../content/types'
import styles from './OrgPage.module.css'

/** A program's page takes the colour of the Proto track it fits, as the track does everywhere. */
const TRACK_HUE: Record<TrackName, Hue> = { Start: 'sky', Build: 'iris', Launch: 'rose' }

/** How often something comes round, in the field's colours by size: the week, the month, the semester. */
const BEAT_HUE: Record<Beat, Hue | undefined> = { weekly: 'sky', monthly: 'iris', semester: 'rose', twice: 'rose', always: undefined }

function Out({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function Missing() {
  const copy = ORG_PAGE.missing
  return (
    <div className={ui.page}>
      <title>{`${copy.title} · ${BRAND.full}`}</title>
      <h1 className={ui.introTitle} data-fog-clear>
        {copy.title}
      </h1>
      <p className={ui.introLede} data-fog-clear>
        {copy.text}
      </p>
      <Link className={ui.primary} to={HUB_PATH} data-fog-clear="box">
        {copy.back}
      </Link>
    </div>
  )
}

/**
 * One BU program, on its own page. The two pages share their parts (what it is, what to go there
 * for, where else to look) but each is laid out for the place it describes: Spark! opens beside
 * the tower it lives in and sets its programs by how often they come round; Innovate@BU opens over
 * a banner and sets its programs as steps up, from a first conversation to a venture.
 */
export function OrgPage() {
  const { slug } = useParams()
  const org = ORGS.find((o) => o.slug === slug)
  if (!org) return <Missing />
  const figure = ORG_PAGE.figure[org.id]

  return (
    <div className={`${ui.page} ${styles.page}`} data-org={org.id} data-hue={TRACK_HUE[org.track]}>
      <title>{`${org.name} · ${BRAND.full}`}</title>

      {org.id === 'spark' ? <TowerOpening org={org} /> : <BannerOpening org={org} />}

      <About org={org} withText={org.id !== 'spark'} />
      {org.figures && (
        <section className={styles.figures} aria-label={org.figuresFrom}>
          <dl>
            {org.figures.map((figure) => (
              <div key={figure.label}>
                <dt>{figure.label}</dt>
                <dd>{figure.value}</dd>
              </div>
            ))}
          </dl>
          {org.figuresFrom && <p className={styles.figuresFrom}>{org.figuresFrom}</p>}
        </section>
      )}
      <Needs org={org} />

      <section className={`${styles.block} ${org.id === 'innovate' ? styles.climbBlock : ''}`} aria-labelledby="programs">
        <div className={styles.blockHead}>
          <h2 id="programs" className={styles.blockTitle}>
            {figure.title}
          </h2>
          <p className={styles.blockLine}>{figure.line}</p>
        </div>
        {org.id === 'spark' ? <Rhythm programs={org.programs} /> : <Climb programs={org.programs} />}
        {ORG_PAGE.example.org === org.id && (
          <p className={styles.example}>
            {ORG_PAGE.example.text}{' '}
            <Link className={ui.textLink} to={ORG_PAGE.example.link.href}>
              {ORG_PAGE.example.link.label}
            </Link>
          </p>
        )}
      </section>

      {org.follow && (
        <p className={styles.follow}>
          <span className={styles.followLabel}>{ORG_PAGE.follow}</span>
          {org.follow.map((link) => (
            <Out key={link.href} className={ui.textLink} href={link.href}>
              {link.label}
            </Out>
          ))}
        </p>
      )}

      <Others org={org} />

      <p className={styles.note}>{ORG_PAGE.checked}</p>
    </div>
  )
}

/** The words every opening starts with: the way back, the name, the one line. */
function Head({ org }: { org: Org }) {
  return (
    <>
      <p className={styles.crumbs} data-fog-clear>
        <Link to={HUB_PATH}>{ORG_PAGE.back}</Link>
        <span aria-hidden="true">/</span>
        <span>{ORG_PAGE.kicker}</span>
      </p>
      <h1 className={styles.name} data-fog-clear>
        {org.name}
      </h1>
      <p className={styles.lede} data-fog-clear>
        {org.line}
      </p>
    </>
  )
}

/** What you need to walk in: where, when it's open, who it's for. Then the way to their own site. */
function WalkIn({ org }: { org: Org }) {
  return (
    <div className={styles.walkIn}>
      <dl className={styles.facts}>
        {org.facts.map((fact) => (
          <div key={fact.term}>
            <dt data-fog-clear>{fact.term}</dt>
            <dd data-fog-clear>{fact.detail}</dd>
          </div>
        ))}
      </dl>
      <Out className={`${ui.secondary} ${styles.site}`} href={org.site.href}>
        {ORG_PAGE.site}: {org.site.label} <span aria-hidden="true">↗</span>
      </Out>
    </div>
  )
}

function Credit({ org }: { org: Org }) {
  return (
    <figcaption className={styles.credit}>
      {org.photoNote && <span>{org.photoNote}</span>}
      <span>
        {ORG_PAGE.photoBy} {org.photo.author},{' '}
        <Out href={org.photo.source}>
          {org.photo.license} {ORG_PAGE.viaCommons}
        </Out>
      </span>
    </figcaption>
  )
}

/** The credit under one of the program's own photos, linked to the page it's from. */
function OwnCredit({ photo }: { photo: OrgPhoto }) {
  return (
    <figcaption className={styles.credit}>
      <span>
        {ORG_PAGE.photoOf}{' '}
        <Out href={photo.source}>{photo.credit}</Out>
      </span>
    </figcaption>
  )
}

/** Spark!: the text beside a photo of the space itself, cropped tall. */
function TowerOpening({ org }: { org: Org }) {
  return (
    <header className={`${styles.opening} ${styles.tower}`}>
      {/* The field drains into harbor from this mark (see Layout): a little above the opening's
          foot, so the drain has finished where the page's text starts. */}
      <span className={styles.groundMark} data-ground-after="" aria-hidden="true" />
      <div className={styles.head}>
        <Head org={org} />
        {/* What it is, here in the opening: the tower is tall, and the text keeps it company. */}
        <div className={styles.openingAbout}>
          {org.about.map((paragraph) => (
            <p key={paragraph} data-fog-clear>
              {paragraph}
            </p>
          ))}
        </div>
        <WalkIn org={org} />
      </div>
      <figure className={styles.plate}>
        <img src={(org.plate ?? org.photo).src} alt={(org.plate ?? org.photo).alt} fetchPriority="high" />
        {org.plate ? <OwnCredit photo={org.plate} /> : <Credit org={org} />}
      </figure>
    </header>
  )
}

/** Innovate@BU: the text, then a photo across the column. The drain runs behind the photo. */
function BannerOpening({ org }: { org: Org }) {
  return (
    <header className={`${styles.opening} ${styles.over}`}>
      <div className={styles.head} data-ground-after="">
        <Head org={org} />
        <WalkIn org={org} />
      </div>
      <figure className={styles.banner}>
        <img src={(org.plate ?? org.photo).src} alt={(org.plate ?? org.photo).alt} fetchPriority="high" />
        {org.plate ? <OwnCredit photo={org.plate} /> : <Credit org={org} />}
      </figure>
    </header>
  )
}

/**
 * What it is, in its own words' worth of space, and where it meets Proto beside it. Spark!'s
 * opening already says what it is, so there only the notes are set, side by side.
 */
function About({ org, withText }: { org: Org; withText: boolean }) {
  return (
    <section className={styles.about} data-notes-only={withText ? undefined : ''} aria-labelledby="about">
      <h2 id="about" className={ui.srOnly}>
        {ORG_PAGE.about}
      </h2>
      {withText && (
        <div className={styles.aboutText}>
          {org.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}
      <dl className={styles.aboutNotes}>
        <div>
          <dt>{ORG_PAGE.fitsTrack(org.track)}</dt>
          <dd>{org.fit}</dd>
        </div>
        <div>
          <dt>{ORG_PAGE.kicker}</dt>
          <dd>{org.part}</dd>
        </div>
        {org.more?.map((note) => (
          <div key={note.term}>
            <dt>{note.term}</dt>
            <dd>{note.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** "Go here to…": each thing you might want, and the program that does it, as one line to follow. */
function Needs({ org }: { org: Org }) {
  return (
    <section className={styles.block} aria-labelledby="needs">
      <h2 id="needs" className={styles.blockTitle}>
        {ORG_PAGE.needs}
      </h2>
      <ul className={styles.needs}>
        {org.needs.map((need) => (
          <li key={need.want}>
            <Out className={styles.need} href={need.href}>
              <span className={styles.want}>{need.want}</span>
              <span className={styles.go}>
                {need.go} <span aria-hidden="true">↗</span>
              </span>
            </Out>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Programs that share a cadence, in the order given. */
function byCadence(programs: readonly Program[]) {
  const groups: { label: string; beat: Beat; programs: Program[] }[] = []
  for (const program of programs) {
    if (!program.every) continue
    const last = groups.at(-1)
    if (last && last.label === program.every.label) last.programs.push(program)
    else groups.push({ ...program.every, programs: [program] })
  }
  return groups
}

/**
 * Spark!'s programs by how often they come round: the cadence set large with a strip of marks for
 * it (a tick a week, a tick a month, a bar a semester), and what happens then beside it.
 */
function Rhythm({ programs }: { programs: readonly Program[] }) {
  return (
    <ol className={styles.rhythm}>
      {byCadence(programs).map((group) => (
        <li key={group.label} className={styles.cadence} data-hue={BEAT_HUE[group.beat]}>
          <div className={styles.every}>
            <span className={styles.everyLabel}>{group.label}</span>
            <span className={styles.beat} data-beat={group.beat} aria-hidden="true" />
          </div>
          <div className={styles.cadencePrograms}>
            {group.programs.map((program) => (
              <Fragment key={program.name}>
                <ProgramText program={program} />
                {program.photo && (
                  <figure className={styles.cadencePhoto}>
                    <img src={program.photo.src} alt={program.photo.alt} loading="lazy" />
                    <OwnCredit photo={program.photo} />
                  </figure>
                )}
              </Fragment>
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** A program as running text: its name, when, what it is, and the way to it on their site. */
function ProgramText({ program }: { program: Program }) {
  return (
    <article className={styles.program}>
      <h3 className={styles.programName}>{program.name}</h3>
      {program.when && <p className={styles.when}>{program.when}</p>}
      <p className={styles.programText}>{program.text}</p>
      <Out className={ui.textLink} href={program.href}>
        {ORG_PAGE.onTheirSite} <span aria-hidden="true">↗</span>
      </Out>
    </article>
  )
}

/**
 * Innovate@BU's programs as steps up: one flight, each step a little higher than the last, from
 * talking an idea through to a summer spent on it. What isn't a step is set under the flight, as
 * text.
 */
function Climb({ programs }: { programs: readonly Program[] }) {
  const steps = programs.filter((program) => !program.aside)
  const asides = programs.filter((program) => program.aside)

  return (
    <>
      <ol className={styles.climb} style={{ '--steps': steps.length } as CSSProperties}>
        {steps.map((program, index) => (
          <li key={program.name} className={styles.step} style={{ '--step': index } as CSSProperties}>
            <span className={styles.stepNumber} aria-hidden="true">
              {index + 1}
            </span>
            <h3 className={styles.programName}>{program.name}</h3>
            {program.stake && <p className={styles.stake}>{program.stake}</p>}
            <p className={styles.programText}>{program.text}</p>
            {program.when && <p className={styles.when}>{program.when}</p>}
            <Out className={ui.textLink} href={program.href}>
              {ORG_PAGE.onTheirSite} <span aria-hidden="true">↗</span>
            </Out>
          </li>
        ))}
      </ol>
      {asides.length > 0 && (
        <div className={styles.asides}>
          <h3 className={styles.asidesTitle}>{ORG_PAGE.alsoThere}</h3>
          <div className={styles.asideList}>
            {asides.map((program) => (
              <ProgramText key={program.name} program={program} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/** The other program's page and the playbook, set as two lines to follow rather than two cards. */
function Others({ org }: { org: Org }) {
  const others: { title: string; line: string; href: string }[] = [
    ...ORGS.filter((o) => o.id !== org.id).map((o) => ({ title: o.name, line: o.line, href: orgHref(o) })),
    { title: PLAYBOOK_CARD.title, line: PLAYBOOK_CARD.line, href: PLAYBOOK_CARD.href },
  ]

  return (
    <nav className={styles.others} aria-labelledby="other">
      <h2 id="other" className={styles.othersTitle}>
        {ORG_PAGE.other}
      </h2>
      <ul>
        {others.map((other) => (
          <li key={other.href}>
            <Link className={styles.other} to={other.href}>
              <span className={styles.otherTitle}>
                {other.title} <span aria-hidden="true">→</span>
              </span>
              <span className={styles.otherLine}>{other.line}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
