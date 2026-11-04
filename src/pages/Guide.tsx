import { Fragment, useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { BRAND } from '../content/site'
import { GUIDE_DOCS } from '../content/guides'
import type { Block, GuideLink, Rich, WinExample } from '../content/guides/types'
import { winHref } from '../content/guides/wins'
import { GUIDE_PAGE, GUIDES, guidePath, RESOURCES_INTRO, type Guide as GuideEntry } from '../content/resources'
import styles from './Guide.module.css'

/** Site routes go through the router; anything else stays a plain anchor. */
function TextLink({ link }: { link: GuideLink }) {
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

function Items({ items }: { items: readonly Rich[] }) {
  return items.map((item, index) => (
    <li key={index} data-fog-clear>
      <RichText text={item} />
    </li>
  ))
}

function Example({ example }: { example: WinExample }) {
  const { win, text } = example
  return (
    <aside className={styles.example} aria-label={`${GUIDE_PAGE.exampleLabel}: ${win.project}`}>
      <p className={styles.exampleHead} data-fog-clear>
        <Link className={styles.exampleName} to={winHref(win)}>
          {win.project}
        </Link>
        <span className={styles.examplePrize}>
          {win.prize}, {win.event}
        </span>
      </p>
      <p data-fog-clear>
        <RichText text={text} />
      </p>
    </aside>
  )
}

// Array.isArray doesn't narrow readonly arrays, so paragraphs need a guard of their own.
function isParagraph(block: Block): block is Rich {
  return typeof block === 'string' || Array.isArray(block)
}

function BlockView({ block }: { block: Block }) {
  if (isParagraph(block)) {
    return (
      <p data-fog-clear>
        <RichText text={block} />
      </p>
    )
  }
  if ('list' in block) {
    return (
      <ul className={styles.list}>
        <Items items={block.list} />
      </ul>
    )
  }
  if ('steps' in block) {
    return (
      <ol className={styles.steps}>
        <Items items={block.steps} />
      </ol>
    )
  }
  if ('callout' in block) {
    return (
      <p className={styles.callout} data-fog-clear>
        <RichText text={block.callout} />
      </p>
    )
  }
  if ('checklist' in block) {
    return (
      <div className={styles.checklist}>
        <h3 className={styles.checklistTitle} data-fog-clear>
          {block.title}
        </h3>
        <ul className={styles.checks}>
          <Items items={block.checklist} />
        </ul>
      </div>
    )
  }
  if ('example' in block) return <Example example={block.example} />
  return (
    <dl className={styles.facts}>
      {block.facts.map((fact) => (
        <div key={fact.term} className={styles.fact}>
          <dt data-fog-clear>{fact.term}</dt>
          <dd data-fog-clear>
            <RichText text={fact.detail} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

type Written = GuideEntry & { slug: string }

/** The written guides in playbook order, so previous and next follow the contents page. */
const WRITTEN = GUIDES.filter((guide): guide is Written => Boolean(guide.slug && GUIDE_DOCS.has(guide.slug)))

function Neighbour({ guide, direction }: { guide: Written; direction: 'previous' | 'next' }) {
  return (
    <Link className={`${styles.neighbour} ${direction === 'next' ? styles.toNext : ''}`} to={guidePath(guide) ?? '/resources'} data-fog-clear>
      <span className={styles.neighbourLabel}>
        {direction === 'previous' && <span aria-hidden="true">← </span>}
        {direction === 'previous' ? GUIDE_PAGE.previous : GUIDE_PAGE.next}
        {direction === 'next' && <span aria-hidden="true"> →</span>}
      </span>
      <span className={styles.neighbourName}>{guide.title}</span>
    </Link>
  )
}

function GuideNav({ slug }: { slug: string }) {
  const index = WRITTEN.findIndex((guide) => guide.slug === slug)
  const previous = index > 0 ? WRITTEN[index - 1] : undefined
  const next = index >= 0 && index < WRITTEN.length - 1 ? WRITTEN[index + 1] : undefined
  return (
    <nav className={styles.neighbours} aria-label={GUIDE_PAGE.navLabel}>
      {previous ? <Neighbour guide={previous} direction="previous" /> : <span />}
      <Link className={`${ui.textLink} ${styles.all}`} to="/resources" data-fog-clear>
        {GUIDE_PAGE.all}
      </Link>
      {next ? <Neighbour guide={next} direction="next" /> : <span />}
    </nav>
  )
}

function GuideMissing() {
  const copy = GUIDE_PAGE.missing
  return (
    <div className={ui.page}>
      <title>{`${copy.title} · ${BRAND.full}`}</title>
      <p className={ui.path} data-fog-clear>
        {RESOURCES_INTRO.path}
      </p>
      <section className={styles.missing}>
        <h1 className={ui.introTitle} data-fog-clear>
          {copy.title}
        </h1>
        <p className={ui.introLede} data-fog-clear>
          {copy.text}
        </p>
        <Link className={ui.primary} to="/resources" data-fog-clear="box">
          {copy.back}
        </Link>
      </section>
    </div>
  )
}

/** One playbook guide: the contents on the field beside the text on deep glass, then the next guide. */
export function Guide() {
  const { slug = '' } = useParams()
  const { hash } = useLocation()
  const doc = GUIDE_DOCS.get(slug)

  // The guide's code loads lazily, so on a fresh load with a #section the browser has already
  // given up looking for it by the time the text mounts. Jump once it's there.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [slug, hash])

  const entry = GUIDES.find((guide) => guide.slug === slug)
  if (!doc || !entry) return <GuideMissing />

  return (
    <div className={ui.page}>
      <PageIntro intro={{ path: `${GUIDE_PAGE.pathRoot}/${slug}`, title: entry.title, lede: entry.line }} />

      <div className={styles.layout}>
        <nav className={styles.contents} aria-labelledby="contents">
          <h2 id="contents" className={styles.contentsTitle} data-fog-clear>
            {GUIDE_PAGE.contentsLabel}
          </h2>
          <ol className={styles.contentsList}>
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} data-fog-clear>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className={`${ui.panelDeep} ${styles.doc}`}>
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`} className={styles.heading} data-fog-clear>
                {section.title}
              </h2>
              {section.body.map((block, index) => (
                <BlockView key={index} block={block} />
              ))}
            </section>
          ))}
        </article>
      </div>

      <GuideNav slug={slug} />
    </div>
  )
}
