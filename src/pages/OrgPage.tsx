import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import ui from '../components/ui.module.css'
import { BRAND } from '../content/site'
import { HUB_PATH, ORG_PAGE, orgHref, ORGS, PLAYBOOK_CARD, type Org } from '../content/resourcesHub'
import styles from './OrgPage.module.css'

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
 * One BU program, on its own page: what it is and the facts you need to walk in, what to go there
 * for, then its programs. Plain navy sheets with hairline rules; the photo as it was taken.
 */
export function OrgPage() {
  const { slug } = useParams()
  const org = ORGS.find((o) => o.slug === slug)
  if (!org) return <Missing />
  const others: { title: string; line: string; href: string }[] = [
    ...ORGS.filter((o) => o.id !== org.id).map((o: Org) => ({ title: o.name, line: o.line, href: orgHref(o) })),
    { title: PLAYBOOK_CARD.title, line: PLAYBOOK_CARD.line, href: PLAYBOOK_CARD.href },
  ]
  const example = ORG_PAGE.example.org === org.id ? ORG_PAGE.example : null

  return (
    <div className={`${ui.page} ${styles.page}`}>
      <title>{`${org.name} · ${BRAND.full}`}</title>

      <header className={styles.head} data-ground-after="">
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
      </header>

      <section className={styles.overview} aria-label={org.name}>
        <figure className={styles.photo}>
          <img src={org.photo.src} alt={org.photo.alt} fetchPriority="high" />
          <figcaption className={styles.credit} data-fog-clear>
            {org.photoNote && <span>{org.photoNote} </span>}
            {ORG_PAGE.photoBy} {org.photo.author},{' '}
            <Out href={org.photo.source}>
              {org.photo.license} {ORG_PAGE.viaCommons}
            </Out>
          </figcaption>
        </figure>

        <div className={styles.sheet}>
          <p className={styles.part}>{org.part}</p>
          {org.about.map((paragraph) => (
            <p key={paragraph} className={styles.about}>
              {paragraph}
            </p>
          ))}
          <dl className={styles.facts}>
            {org.facts.map((fact) => (
              <div key={fact.term} className={styles.fact}>
                <dt>{fact.term}</dt>
                <dd>{fact.detail}</dd>
              </div>
            ))}
            <div className={styles.fact}>
              <dt>{ORG_PAGE.fitsTrack(org.track)}</dt>
              <dd>{org.fit}</dd>
            </div>
          </dl>
          <Out className={`${ui.secondary} ${styles.site}`} href={org.site.href}>
            {ORG_PAGE.site}: {org.site.label} <span aria-hidden="true">↗</span>
          </Out>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="needs">
        <h2 id="needs" className={styles.blockTitle} data-fog-clear>
          {ORG_PAGE.needs}
        </h2>
        <ul className={`${styles.sheet} ${styles.needs}`}>
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

      <section className={styles.block} aria-labelledby="programs">
        <h2 id="programs" className={styles.blockTitle} data-fog-clear>
          {ORG_PAGE.programs}
        </h2>
        <ul className={styles.programs}>
          {org.programs.map((program) => (
            <li key={program.name} className={styles.program}>
              <h3 className={styles.programName}>{program.name}</h3>
              <p className={styles.programText}>{program.text}</p>
              {program.when && <p className={styles.when}>{program.when}</p>}
              <Out className={ui.textLink} href={program.href}>
                {ORG_PAGE.onTheirSite} <span aria-hidden="true">↗</span>
              </Out>
            </li>
          ))}
        </ul>
        {example && (
          <p className={styles.example} data-fog-clear>
            {example.text}{' '}
            <Link className={ui.textLink} to={example.link.href}>
              {example.link.label}
            </Link>
          </p>
        )}
      </section>

      <section className={styles.block} aria-labelledby="other">
        <h2 id="other" className={styles.blockTitle} data-fog-clear>
          {ORG_PAGE.other}
        </h2>
        <ul className={styles.others}>
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
      </section>

      <p className={styles.note} data-fog-clear>
        {ORG_PAGE.checked}
      </p>
    </div>
  )
}
