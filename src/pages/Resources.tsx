import { Link } from 'react-router'
import { Byline } from '../components/Byline'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { CONTENTS_LABEL, GUIDE_PAGE, GUIDES, guidePath, RESOURCES_INTRO, type Guide } from '../content/resources'
import styles from './Resources.module.css'

type Written = Guide & { slug: string; lead: NonNullable<Guide['lead']> }

const isWritten = (guide: Guide): guide is Written => Boolean(guide.slug && guide.lead)

const WRITTEN = GUIDES.filter(isWritten)
const SOON = GUIDES.filter((guide) => !isWritten(guide))
const [FEATURED, ...REST] = WRITTEN
// The next few guides get a picture each across the top; the rest pair up below in two columns,
// so the tier above takes whatever would leave the list with an odd one out.
const TIER = REST.length % 2 === 1 ? 3 : 2
const NEXT = REST.slice(0, TIER)
const LIST = REST.slice(TIER)

function Featured({ guide }: { guide: Written }) {
  const href = guidePath(guide) ?? '/resources'
  const { image, authors, updated } = guide.lead
  return (
    <section className={styles.featured} aria-labelledby="featured">
      <Link className={styles.featuredImage} to={href} tabIndex={-1} aria-hidden="true">
        <img src={image.src} alt="" fetchPriority="high" />
      </Link>
      <div className={styles.featuredText}>
        <p className={styles.featuredLabel} data-fog-clear>
          {GUIDE_PAGE.featured}
        </p>
        <h2 id="featured" className={styles.featuredTitle} data-fog-clear>
          <Link to={href}>{guide.title}</Link>
        </h2>
        <p className={styles.featuredLine} data-fog-clear>
          {guide.line}
        </p>
        <Byline authors={authors} updated={updated} copy={GUIDE_PAGE} />
        <Link className={`${ui.primary} ${styles.read}`} to={href} data-fog-clear="box">
          {GUIDE_PAGE.readGuide}
        </Link>
      </div>
    </section>
  )
}

/** The playbook as a magazine's contents: the lead guide large, the next few as a row of pictures,
 * the rest as a two-column list, and the ones still being written listed quietly after them. */
export function Resources() {
  return (
    <div className={ui.page}>
      <PageIntro intro={RESOURCES_INTRO} />

      {FEATURED && <Featured guide={FEATURED} />}

      <section className={`${ui.panelDeep} ${styles.book}`} aria-labelledby="contents">
        {/* The list explains itself; the heading is for screen readers. */}
        <h2 id="contents" className={ui.srOnly}>
          {CONTENTS_LABEL}
        </h2>
        <ol className={styles.tier}>
          {NEXT.map((guide) => {
            const href = guidePath(guide) ?? '/resources'
            const image = guide.lead.image
            return (
              <li key={guide.title}>
                <Link className={styles.card} to={href}>
                  <span className={styles.cardImage}>
                    <img src={image.thumb ?? image.src} alt="" loading="lazy" />
                  </span>
                  <span className={styles.entryText} data-fog-clear>
                    <span className={styles.cardTitle}>{guide.title}</span>
                    <span className={styles.line}>{guide.line}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>

        <ol className={styles.toc}>
          {LIST.map((guide) => {
            const href = guidePath(guide) ?? '/resources'
            const image = guide.lead.image
            return (
              <li key={guide.title}>
                <Link className={styles.entry} to={href}>
                  <img className={styles.thumb} src={image.thumb ?? image.src} alt="" loading="lazy" />
                  <span className={styles.entryText} data-fog-clear>
                    <span className={styles.title}>{guide.title}</span>
                    <span className={styles.line}>{guide.line}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>

        {SOON.length > 0 && (
          <div className={styles.soon}>
            <h3 className={styles.soonTitle} data-fog-clear>
              {GUIDE_PAGE.stillWriting}
            </h3>
            <ul className={styles.soonList}>
              {SOON.map((guide) => (
                <li key={guide.title} data-fog-clear>
                  <span className={styles.soonName}>{guide.title}</span>
                  <span className={styles.line}>{guide.line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
