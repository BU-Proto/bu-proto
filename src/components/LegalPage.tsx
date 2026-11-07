import { Fragment } from 'react'
import { Link } from 'react-router'
import { EFFECTIVE_DATE, type Block, type LegalDoc, type LegalLink, type Rich } from '../content/legal'
import { PageIntro } from './PageIntro'
import ui from './ui.module.css'
import styles from './LegalPage.module.css'

/** Site routes go through the router; mailto and outside links stay plain anchors. */
function TextLink({ link }: { link: LegalLink }) {
  if (link.href.startsWith('/')) {
    return (
      <Link className={styles.link} to={link.href}>
        {link.label}
      </Link>
    )
  }
  return (
    <a className={styles.link} href={link.href}>
      {link.label}
    </a>
  )
}

function RichText({ text }: { text: Rich }) {
  if (typeof text === 'string') return text
  return text.map((part, index) => (
    <Fragment key={index}>
      {typeof part === 'string' ? part : 'strong' in part ? <strong>{part.strong}</strong> : <TextLink link={part} />}
    </Fragment>
  ))
}

function BlockView({ block }: { block: Block }) {
  if (typeof block === 'object' && 'list' in block) {
    return (
      <ul className={styles.list}>
        {block.list.map((item, index) => (
          <li key={index}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p>
      <RichText text={block} />
    </p>
  )
}

/** Privacy and Terms: a sticky contents list beside the long text. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className={ui.page}>
      <PageIntro intro={doc.intro}>
        <p className={styles.effective}>
          Effective {EFFECTIVE_DATE}
        </p>
      </PageIntro>

      <div className={styles.layout}>
        <nav className={styles.contents} aria-labelledby="contents">
          <h2 id="contents" className={styles.contentsTitle}>
            {doc.contentsLabel}
          </h2>
          <ol className={styles.contentsList}>
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className={styles.doc}>
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`} className={styles.heading}>
                {section.title}
              </h2>
              {section.body.map((block, index) => (
                <BlockView key={index} block={block} />
              ))}
            </section>
          ))}
          <p className={styles.other}>
            <TextLink link={doc.other} /> <span aria-hidden="true">→</span>
          </p>
        </article>
      </div>
    </div>
  )
}
