import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { MaskLines } from '../components/motion/MaskLines'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
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
      <h1 className={ui.introTitle}>
        {copy.title}
      </h1>
      <p className={ui.introLede}>
        {copy.text}
      </p>
      <Link className={ui.primary} to={HUB_PATH}>
        {copy.back}
      </Link>
    </div>
  )
}

/**
 * One BU program, on its own page: what it is and the facts you need to walk in, what to go there
 * for, then its programs, each heading on the left of its list. White paper and hairline rules; the
 * photo as it was taken.
 */
export function OrgPage() {
  const { slug } = useParams()
  const reveal = useReveal<HTMLDivElement>()
  const org = ORGS.find((o) => o.slug === slug)
  if (!org) return <Missing />
  const others: { title: string; line: string; href: string }[] = [
    ...ORGS.filter((o) => o.id !== org.id).map((o: Org) => ({ title: o.name, line: o.line, href: orgHref(o) })),
    { title: PLAYBOOK_CARD.title, line: PLAYBOOK_CARD.line, href: PLAYBOOK_CARD.href },
  ]
  const example = ORG_PAGE.example.org === org.id ? ORG_PAGE.example : null

  return (
    <div ref={reveal} className={`${ui.page} ${motion.reveal} ${styles.page}`}>
      <title>{`${org.name} · ${BRAND.full}`}</title>

      <header className={ui.intro}>
        <p className={`${ui.mono} ${styles.crumbs}`}>
          <Link to={HUB_PATH}>{ORG_PAGE.back}</Link>
          <span aria-hidden="true">/</span>
          <span>{ORG_PAGE.kicker}</span>
        </p>
        <h1 className={ui.introTitle}>
          <MaskLines text={org.name} delay={100} />
        </h1>
        <p className={ui.introLede}>
          {org.line}
        </p>
      </header>

      <section className={styles.overview} aria-label={org.name}>
        <figure className={styles.photo} data-reveal>
          <img src={org.photo.src} alt={org.photo.alt} fetchPriority="high" />
          <figcaption className={styles.credit}>
            {org.photoNote && <span>{org.photoNote} </span>}
            {ORG_PAGE.photoBy} {org.photo.author},{' '}
            <Out href={org.photo.source}>
              {org.photo.license} {ORG_PAGE.viaCommons}
            </Out>
          </figcaption>
        </figure>

        <div data-reveal>
          <p className={`${ui.mono} ${styles.part}`}>{org.part}</p>
          {org.about.map((paragraph) => (
            <p key={paragraph} className={`${ui.body} ${styles.about}`}>
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
        <span className={styles.rule} data-reveal="rule" aria-hidden="true" />
        <h2 id="needs" className={ui.h2}>
          {ORG_PAGE.needs}
        </h2>
        <ul className={styles.rows}>
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
        <span className={styles.rule} data-reveal="rule" aria-hidden="true" />
        <h2 id="programs" className={ui.h2}>
          {ORG_PAGE.programs}
        </h2>
        <ul className={styles.rows}>
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
          <p className={`${ui.small} ${styles.example}`}>
            {example.text}{' '}
            <Link className={ui.textLink} to={example.link.href}>
              {example.link.label}
            </Link>
          </p>
        )}
      </section>

      <section className={styles.block} aria-labelledby="other">
        <span className={styles.rule} data-reveal="rule" aria-hidden="true" />
        <h2 id="other" className={ui.h2}>
          {ORG_PAGE.other}
        </h2>
        <ul className={styles.rows}>
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

      <p className={ui.small}>
        {ORG_PAGE.checked}
      </p>
    </div>
  )
}
