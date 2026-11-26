import { Fragment, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router'
import { GroupTabs } from '../components/GroupTabs'
import ui from '../components/ui.module.css'
import { BUSINESS_GUIDES, BUSINESS_PLAYBOOK, BUSINESS_PLAYBOOK_HREF, businessGuidePath, type GuideBlock } from '../content/businessGuides'
import { BRAND } from '../content/site'
import styles from './BusinessPlaybook.module.css'

/**
 * The Business group's playbook, /business/playbook: the group's tabs, a short intro, then each
 * guide as an amber tile with its number, title, line and reading time, after brand.dropbox.com.
 */
export function BusinessPlaybook() {
  return (
    <div className={ui.page}>
      <title>{`${BUSINESS_PLAYBOOK.tab} · ${BRAND.name}`}</title>
      <GroupTabs group="business" />

      <header className={styles.intro}>
        <p className={styles.label}>{BUSINESS_PLAYBOOK.label}</p>
        <h1 className={styles.title} data-fog-clear>
          {BUSINESS_PLAYBOOK.title}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {BUSINESS_PLAYBOOK.lede}
        </p>
      </header>

      <ol className={styles.guides} data-grid>
        {BUSINESS_GUIDES.map((guide, index) => (
          <li key={guide.slug} style={{ '--n': index } as CSSProperties}>
            <Link to={businessGuidePath(guide)} className={styles.tile} data-tone="amber">
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.tileTitle}>{guide.title}</span>
              <span className={styles.tileSummary}>{guide.summary}</span>
              <span className={styles.tileMeta}>
                {BUSINESS_PLAYBOOK.minutes(guide.minutes)}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Block({ block }: { block: GuideBlock }) {
  if ('p' in block) return <p className={styles.paragraph}>{block.p}</p>
  return (
    <ul className={styles.list}>
      {block.list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * One guide, /business/playbook/:slug: its number, title, line, byline and reading time, then
 * its sections at a reading width, where to take it at Proto, and the guides either side.
 */
export function BusinessGuide() {
  const { slug = '' } = useParams()
  const index = BUSINESS_GUIDES.findIndex((guide) => guide.slug === slug)
  const guide = BUSINESS_GUIDES[index]

  if (!guide) {
    return (
      <div className={ui.page}>
        <title>{`${BUSINESS_PLAYBOOK.notFound.title} · ${BRAND.name}`}</title>
        <GroupTabs group="business" />
        <div className={styles.missing}>
          <h1 className={styles.missingTitle}>{BUSINESS_PLAYBOOK.notFound.title}</h1>
          <p className={styles.lede}>{BUSINESS_PLAYBOOK.notFound.text}</p>
          <Link className={ui.textLink} to={BUSINESS_PLAYBOOK_HREF}>
            {BUSINESS_PLAYBOOK.notFound.link}
          </Link>
        </div>
      </div>
    )
  }

  const previous = BUSINESS_GUIDES[index - 1]
  const next = BUSINESS_GUIDES[index + 1]

  return (
    <div className={ui.page}>
      <title>{`${guide.title} · ${BUSINESS_PLAYBOOK.tab} · ${BRAND.name}`}</title>
      <GroupTabs group="business" />

      <article className={styles.article}>
        <Link className={styles.back} to={BUSINESS_PLAYBOOK_HREF}>
          <span aria-hidden="true">← </span>
          {BUSINESS_PLAYBOOK.back}
        </Link>
        <header className={styles.guideHead}>
          <p className={styles.label}>{BUSINESS_PLAYBOOK.guideOf(index, BUSINESS_GUIDES.length)}</p>
          <h1 className={styles.guideTitle} data-fog-clear>
            {guide.title}
          </h1>
          <p className={styles.lede} data-fog-clear>
            {guide.summary}
          </p>
          <p className={styles.byline}>
            {BUSINESS_PLAYBOOK.byline} · {BUSINESS_PLAYBOOK.minutes(guide.minutes)}
          </p>
        </header>

        {guide.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.heading}</h2>
            {section.blocks.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
          </section>
        ))}

        <aside className={styles.atProto} data-tone="amber">
          <p className={styles.atProtoLabel}>{BUSINESS_PLAYBOOK.atProto}</p>
          <p className={styles.atProtoText}>{guide.atProto.text}</p>
          <p className={styles.atProtoLinks}>
            {guide.atProto.links.map((link, linkIndex) => (
              <Fragment key={link.href}>
                {linkIndex > 0 && <span aria-hidden="true"> · </span>}
                <Link to={link.href}>{link.label}</Link>
              </Fragment>
            ))}
          </p>
        </aside>

        <nav className={styles.pager} aria-label={BUSINESS_PLAYBOOK.tab}>
          {previous ? (
            <Link className={styles.pagerLink} to={businessGuidePath(previous)}>
              <span className={styles.pagerLabel}>{BUSINESS_PLAYBOOK.previous}</span>
              <span className={styles.pagerTitle}>{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link className={`${styles.pagerLink} ${styles.pagerNext}`} to={businessGuidePath(next)}>
              <span className={styles.pagerLabel}>{BUSINESS_PLAYBOOK.next}</span>
              <span className={styles.pagerTitle}>{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}
