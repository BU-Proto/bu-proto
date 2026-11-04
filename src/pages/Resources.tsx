import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { CONTENTS_LABEL, GUIDES, RESOURCES_INTRO } from '../content/resources'
import styles from './Resources.module.css'

/** The playbook as a book's table of contents, chapters joined to their status by dot leaders. */
export function Resources() {
  return (
    <div className={ui.page}>
      <PageIntro intro={RESOURCES_INTRO} />

      <section className={`${ui.panelDeep} ${styles.book}`} aria-labelledby="contents">
        <h2 id="contents" className={styles.contents} data-fog-clear>
          {CONTENTS_LABEL}
        </h2>
        <ol className={styles.toc}>
          {GUIDES.map((guide, index) => {
            const body = (
              <>
                <span className={styles.chapter} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.titleRow}>
                  <span className={styles.title} data-fog-clear>
                    {guide.title}
                  </span>
                  <span className={styles.leader} aria-hidden="true" />
                  <span className={styles.state} data-ready={Boolean(guide.href)} data-fog-clear>
                    {guide.href ? 'read' : 'soon'}
                  </span>
                </span>
                <span className={styles.line} data-fog-clear>
                  {guide.line}
                </span>
              </>
            )
            return (
              <li key={guide.title}>
                {guide.href ? (
                  <a className={styles.entry} href={guide.href}>
                    {body}
                  </a>
                ) : (
                  <div className={styles.entry}>{body}</div>
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
