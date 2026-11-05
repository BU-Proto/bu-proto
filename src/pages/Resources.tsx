import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { GUIDES, guidePath, type Guide } from '../content/resources'
import { AROUND_BU, HUB_INTRO, NEEDS, ORG_COPY, ORGS, PATH, PLAYBOOK_CARD, type Org } from '../content/resourcesHub'
import styles from './Resources.module.css'

type Written = Guide & { slug: string; lead: NonNullable<Guide['lead']> }

const WRITTEN = GUIDES.filter((guide): guide is Written => Boolean(guide.slug && guide.lead))
const ORG_HUE = Object.fromEntries(ORGS.map((org) => [org.id, org.hue]))

/** An outside site: a new tab, so the hub stays where it was. */
function Out({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

/** Our own resource first: the playbook, with its lead photo and the first few guides by name. */
function PlaybookCard() {
  const lead = WRITTEN[0]
  return (
    <section className={`${ui.panelDeep} ${styles.playbook}`} aria-labelledby="playbook">
      {lead && (
        <Link className={styles.playbookImage} to={PLAYBOOK_CARD.cta.href} tabIndex={-1} aria-hidden="true">
          <img src={lead.lead.image.src} alt="" fetchPriority="high" />
        </Link>
      )}
      <div className={styles.playbookText}>
        <p className={styles.label}>
          {PLAYBOOK_CARD.label}
          <span className={styles.count}>{PLAYBOOK_CARD.count(WRITTEN.length)}</span>
        </p>
        <h2 id="playbook" className={styles.playbookTitle}>
          <Link to={PLAYBOOK_CARD.cta.href}>{PLAYBOOK_CARD.title}</Link>
        </h2>
        <p className={styles.playbookLine}>{PLAYBOOK_CARD.text}</p>
        <ul className={styles.guideList}>
          {WRITTEN.slice(0, PLAYBOOK_CARD.preview).map((guide) => (
            <li key={guide.slug}>
              <Link to={guidePath(guide) ?? PLAYBOOK_CARD.cta.href}>{guide.title}</Link>
            </li>
          ))}
        </ul>
        <Link className={`${ui.primary} ${styles.open}`} to={PLAYBOOK_CARD.cta.href}>
          {PLAYBOOK_CARD.cta.label}
        </Link>
      </div>
    </section>
  )
}

function OrgCard({ org }: { org: Org }) {
  return (
    <article className={`${ui.panelDeep} ${styles.org}`} data-hue={org.hue} aria-labelledby={`org-${org.id}`}>
      <header className={styles.orgHead}>
        <h3 id={`org-${org.id}`} className={styles.orgName}>
          {org.name}
        </h3>
        <p className={styles.orgPart}>{org.part}</p>
      </header>
      <p className={styles.orgText}>{org.text}</p>
      <p className={styles.fit}>{org.fit}</p>

      <dl className={`${ui.inset} ${styles.place}`}>
        <dt>{ORG_COPY.where}</dt>
        <dd>
          {org.place.where} {org.place.hours}
        </dd>
      </dl>

      <h4 className={styles.programsTitle}>{ORG_COPY.programs}</h4>
      <ul className={styles.programs}>
        {org.programs.map((program) => (
          <li key={program.name} className={styles.program}>
            <Out className={styles.programName} href={program.href}>
              {program.name}
            </Out>
            <span className={styles.programText}>{program.text}</span>
            {program.when && <span className={styles.when}>{program.when}</span>}
          </li>
        ))}
      </ul>

      <p className={styles.visit}>
        {ORG_COPY.visit}{' '}
        <Out className={ui.textLink} href={org.site.href}>
          {org.site.label}
        </Out>
      </p>
    </article>
  )
}

/**
 * The resources hub: our playbook, then BU's two programs for builders, Spark! and Innovate@BU.
 * Said in the order a student meets them: how the three fit, which to go to for what, then each
 * one in full. Theirs are described and linked, never spoken for.
 */
export function Resources() {
  return (
    <div className={ui.page}>
      <PageIntro intro={HUB_INTRO} />

      <PlaybookCard />

      <section id={AROUND_BU.id} className={styles.around} aria-labelledby="around-title">
        <header className={styles.aroundHead}>
          <h2 id="around-title" className={styles.aroundTitle} data-fog-clear>
            {AROUND_BU.title}
          </h2>
          <p className={ui.sectionLede}>{AROUND_BU.lede}</p>
        </header>

        <div className={styles.path} aria-labelledby="path-title">
          <h3 id="path-title" className={ui.srOnly}>
            {PATH.title}
          </h3>
          <ol className={styles.steps}>
            {PATH.steps.map((step, index) => (
              <li key={step.name} className={styles.step} data-hue={step.hue}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.stepName}>{step.name}</span>
                <span className={styles.stepText}>{step.text}</span>
              </li>
            ))}
          </ol>
          <p className={styles.example} data-fog-clear>
            {PATH.example.lead}{' '}
            <Link className={ui.textLink} to={PATH.example.win.href}>
              {PATH.example.win.label}
            </Link>
          </p>
        </div>

        <section className={`${ui.panel} ${styles.needs}`} aria-labelledby="needs-title">
          <h3 id="needs-title" className={styles.needsTitle}>
            {NEEDS.title}
          </h3>
          <ul className={styles.needList}>
            {NEEDS.items.map((need) => (
              <li key={need.want} className={styles.need} data-hue={need.org ? ORG_HUE[need.org] : undefined}>
                <span className={styles.want}>{need.want}</span>
                <Out className={styles.go} href={need.href}>
                  {need.go}
                  <span aria-hidden="true"> ↗</span>
                </Out>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.orgs}>
          {ORGS.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>

        <p className={styles.note} data-fog-clear>
          {AROUND_BU.note}
        </p>
      </section>
    </div>
  )
}
