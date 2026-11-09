import { Fragment, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { AuthorName, AuthorPhoto, Byline } from '../components/Byline'
import { DetailOpener, DetailPage } from '../components/DetailPage'
import { Graphic } from '../components/guide/Graphics'
import ui from '../components/ui.module.css'
import { BRAND } from '../content/site'
import { GUIDE_DOCS } from '../content/guides'
import { type Author, authorsOn, nameList } from '../content/guides/authors'
import type { Block, GuideDoc, GuideImage, GuideLink, GuideSection, Rich, WinExample } from '../content/guides/types'
import { winHref, winThumb } from '../content/guides/wins'
import { GUIDE_PAGE, GUIDES, guidePath, PLAYBOOK_HREF, PLAYBOOK_INTRO, type Guide as GuideEntry } from '../content/resources'
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

/** Who took it, or whose write-up it's from. */
function Credit({ image }: { image: GuideImage }) {
  const { credit } = image
  if ('win' in credit) {
    return (
      <>
        {GUIDE_PAGE.photoFrom}{' '}
        <Link to={winHref(credit.win)}>
          {credit.win.project} {GUIDE_PAGE.writeUp}
        </Link>
      </>
    )
  }
  return (
    <>
      {GUIDE_PAGE.photoBy} {credit.author},{' '}
      <a href={credit.source} target="_blank" rel="noopener noreferrer">
        {credit.license} {GUIDE_PAGE.viaCommons}
      </a>
    </>
  )
}

function Figure({ image, caption, shape = 'wide' }: { image: GuideImage; caption: Rich; shape?: 'wide' | 'tall' }) {
  return (
    <figure className={shape === 'tall' ? styles.tall : styles.wide}>
      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
      <figcaption className={styles.figcaption} data-fog-clear>
        <span>
          <RichText text={caption} />
        </span>
        <span className={styles.credit}>
          <Credit image={image} />
        </span>
      </figcaption>
    </figure>
  )
}

/** A win told as an example: its cover, its prize, the point, and which of us was on the team. */
function Example({ example, authors, card = false }: { example: WinExample; authors: readonly Author[]; card?: boolean }) {
  const { win, text } = example
  const on = authorsOn(win, authors)
  return (
    <aside className={card ? styles.exampleCard : styles.example} aria-label={`${GUIDE_PAGE.exampleLabel}: ${win.project}`}>
      {/* The name links to the win too; the picture is a bigger target for the same place. */}
      <Link className={styles.exampleThumb} to={winHref(win)} tabIndex={-1} aria-hidden="true">
        <img src={winThumb(win.cover)} alt="" loading="lazy" width={333} height={222} />
      </Link>
      <div className={styles.exampleBody} data-fog-clear>
        <p className={styles.exampleLabel}>{GUIDE_PAGE.exampleLabel}</p>
        <p className={styles.exampleHead}>
          <Link className={styles.exampleName} to={winHref(win)}>
            {win.project}
          </Link>
          <span className={styles.examplePrize}>
            {win.prize}, {win.event}
          </span>
        </p>
        <p>
          <RichText text={text} />
        </p>
        {on.length > 0 && (
          <p className={styles.exampleTeam}>
            <span className={styles.teamPhotos}>
              {on.map((author) => (
                <AuthorPhoto key={author.href} author={author} />
              ))}
            </span>
            {GUIDE_PAGE.onTeam(nameList(on.map((author) => author.firstName)))}
          </p>
        )}
      </div>
    </aside>
  )
}

// Array.isArray doesn't narrow readonly arrays, so paragraphs need a guard of their own.
function isParagraph(block: Block): block is Rich {
  return typeof block === 'string' || Array.isArray(block)
}

function BlockView({ block, authors }: { block: Block; authors: readonly Author[] }) {
  if (isParagraph(block)) {
    return (
      <p className={styles.para} data-fog-clear>
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
      <div className={styles.callout} data-fog-clear>
        <p className={styles.calloutLabel}>{block.label ?? GUIDE_PAGE.ruleOfThumb}</p>
        <p className={styles.calloutText}>
          <RichText text={block.callout} />
        </p>
      </div>
    )
  }
  if ('pull' in block) {
    // The line is already in the text around it, so it's read once, there.
    return (
      <p className={styles.pull} aria-hidden="true" data-fog-clear>
        {block.pull}
      </p>
    )
  }
  if ('checklist' in block) {
    return (
      <div className={styles.checklist}>
        <h3 className={styles.checklistTitle} data-fog-clear>
          <svg className={styles.checkMark} width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="11" fill="currentColor" />
            <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="var(--navy)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {block.title}
        </h3>
        <ul className={styles.checks}>
          <Items items={block.checklist} />
        </ul>
      </div>
    )
  }
  if ('example' in block) return <Example example={block.example} authors={authors} />
  if ('figure' in block) return <Figure image={block.figure} caption={block.caption} shape={block.shape} />
  if ('graphic' in block) {
    return (
      <div className={styles.graphicSlot}>
        <Graphic name={block.graphic} />
      </div>
    )
  }
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

type Run = { block: Block } | { examples: WinExample[] }

/** Examples in a row are set side by side as one spread, so the same block never stacks on
 * itself; every other block stands alone. */
function runs(body: readonly Block[]): Run[] {
  const out: Run[] = []
  for (const block of body) {
    const last = out[out.length - 1]
    if (!isParagraph(block) && 'example' in block) {
      if (last && 'examples' in last) last.examples.push(block.example)
      else out.push({ examples: [block.example] })
    } else {
      out.push({ block })
    }
  }
  return out
}

function SectionBody({ section, authors }: { section: GuideSection; authors: readonly Author[] }) {
  return runs(section.body).map((run, i) => {
    if ('block' in run) return <BlockView key={i} block={run.block} authors={authors} />
    if (run.examples.length === 1) return <Example key={i} example={run.examples[0]} authors={authors} />
    return (
      <div key={i} className={styles.examplePair}>
        {run.examples.map((example) => (
          <Example key={example.win.id} example={example} authors={authors} card />
        ))}
      </div>
    )
  })
}

/** Two lines on each author: who they are, then the wins they were on, each linked. */
function AuthorNote({ authors }: { authors: readonly Author[] }) {
  return (
    <section id="authors" className={styles.authors} aria-labelledby="authors-title">
      <h2 id="authors-title" className={styles.authorsTitle} data-fog-clear>
        {GUIDE_PAGE.authorsTitle}
      </h2>
      <ul className={styles.authorList}>
        {authors.map((author) => (
          <li key={author.href} className={styles.author}>
            <AuthorPhoto author={author} size="large" />
            <div className={styles.authorText} data-fog-clear>
              <p className={styles.authorName}>
                <AuthorName author={author} />
              </p>
              <p>{author.role}</p>
              <p className={styles.authorWins}>
                {GUIDE_PAGE.winsWith}{' '}
                {author.wins.map((win, index) => (
                  <Fragment key={win.id}>
                    {index > 0 && '; '}
                    <Link className={styles.link} to={winHref(win)}>
                      {win.project}
                    </Link>
                    , {win.prize} at {win.event}
                  </Fragment>
                ))}
                .
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Written = GuideEntry & { slug: string; lead: NonNullable<GuideEntry['lead']> }

/** The written guides in playbook order, so previous and next follow the contents page. */
const WRITTEN = GUIDES.filter((guide): guide is Written => Boolean(guide.slug && guide.lead && GUIDE_DOCS.has(guide.slug)))

function words(text: Rich): number {
  const plain = typeof text === 'string' ? text : text.map((part) => (typeof part === 'string' ? part : 'strong' in part ? part.strong : part.label)).join('')
  return plain.split(/\s+/).filter(Boolean).length
}

function blockWords(block: Block): number {
  if (isParagraph(block)) return words(block)
  if ('list' in block) return block.list.reduce((sum, item) => sum + words(item), 0)
  if ('steps' in block) return block.steps.reduce((sum, item) => sum + words(item), 0)
  if ('checklist' in block) return block.checklist.reduce((sum, item) => sum + words(item), 0)
  if ('callout' in block) return words(block.callout)
  if ('example' in block) return words(block.example.text)
  if ('facts' in block) return block.facts.reduce((sum, fact) => sum + words(fact.detail), 0)
  if ('figure' in block) return words(block.caption)
  return 0
}

/** At about 230 words a minute, counting every block but the pictures. */
function readingMinutes(doc: GuideDoc): number {
  const total = doc.sections.reduce((sum, section) => sum + section.body.reduce((s, block) => s + blockWords(block), 0), words(doc.standfirst))
  return Math.max(1, Math.round(total / 230))
}

function readTime(guide: Written): string {
  const doc = GUIDE_DOCS.get(guide.slug)
  return doc ? GUIDE_PAGE.readTime(readingMinutes(doc)) : ''
}

/**
 * The end of a guide leads on instead of stopping: the next guide large, with its photo, then the
 * way back. The last guide leads back to the first.
 */
function UpNext({ index }: { index: number }) {
  const last = index === WRITTEN.length - 1
  const next = WRITTEN[last ? 0 : index + 1]
  const previous = WRITTEN[index - 1]
  if (!next || next.slug === WRITTEN[index]?.slug) return null
  const href = guidePath(next) ?? PLAYBOOK_HREF
  const { image } = next.lead
  return (
    <section className={styles.upNext} aria-labelledby="up-next">
      <Link className={`${ui.panelDeep} ${styles.nextCard}`} to={href}>
        <span className={styles.nextImage}>
          <img src={image.src} alt="" loading="lazy" decoding="async" />
        </span>
        <span className={styles.nextText} data-fog-clear>
          <span id="up-next" className={styles.nextLabel}>
            {last ? GUIDE_PAGE.backToStart : GUIDE_PAGE.upNext}
          </span>
          <span className={styles.nextTitle}>{next.title}</span>
          <span className={styles.nextLine}>{next.line}</span>
          <span className={styles.nextMeta}>{readTime(next)}</span>
          <span className={`${ui.primary} ${styles.nextButton}`}>{GUIDE_PAGE.readNext}</span>
        </span>
      </Link>
      <nav className={styles.moreGuides} aria-label={GUIDE_PAGE.navLabel}>
        {previous ? (
          <Link className={styles.moreLink} to={guidePath(previous) ?? PLAYBOOK_HREF} data-fog-clear>
            <span aria-hidden="true">← </span>
            {GUIDE_PAGE.previous}: {previous.title}
          </Link>
        ) : (
          <span />
        )}
        <Link className={styles.moreLink} to={PLAYBOOK_HREF} data-fog-clear>
          {GUIDE_PAGE.all}
        </Link>
      </nav>
    </section>
  )
}

// Where the contents sits beside the text. Narrower, it sits above it, folded, so the first
// screen is the guide and not a list of headings. Matches the breakpoint in Guide.module.css.
const WIDE = '(min-width: 861px)'

function useContentsOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.matchMedia(WIDE).matches)
  useEffect(() => {
    const query = window.matchMedia(WIDE)
    const onChange = () => {
      if (query.matches) setOpen(true)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return [open, setOpen]
}

/** The section in view, for the contents. Picks the last heading above a line a third of the
 * way down the screen, which is where the eye is while reading. */
function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined)
  const key = ids.join(' ')
  useEffect(() => {
    const targets = key
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return
    // One measure per frame however fast the scroll events come.
    const pending = { frame: 0 }
    const update = () => {
      pending.frame = 0
      const line = window.innerHeight / 3
      let current: string | undefined
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) current = el.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!pending.frame) pending.frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (pending.frame) cancelAnimationFrame(pending.frame)
    }
  }, [key])
  return active
}

function GuideMissing() {
  const copy = GUIDE_PAGE.missing
  return (
    <div className={ui.page}>
      <title>{`${copy.title} · ${BRAND.full}`}</title>
      <section className={styles.missing}>
        <h1 className={ui.introTitle} data-fog-clear>
          {copy.title}
        </h1>
        <p className={ui.introLede} data-fog-clear>
          {copy.text}
        </p>
        <Link className={ui.primary} to={PLAYBOOK_HREF} data-fog-clear="box">
          {copy.back}
        </Link>
      </section>
    </div>
  )
}

/**
 * One playbook guide, set like a magazine piece: the lead photo under the title and byline, then
 * the contents on the field beside the text on deep glass, with pictures and diagrams running
 * wider than the text, the authors' note, and the next guide.
 */
export function Guide() {
  const { slug = '' } = useParams()
  const { hash } = useLocation()
  const doc = GUIDE_DOCS.get(slug)

  // The guide's code loads lazily, so on a fresh load with a #section the browser has already
  // given up looking for it by the time the text mounts. Jump once it's there.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [slug, hash])

  const ids = doc ? [...doc.sections.map((section) => section.id), 'authors'] : []
  const active = useActiveSection(ids)
  const [contentsOpen, setContentsOpen] = useContentsOpen()

  const index = WRITTEN.findIndex((guide) => guide.slug === slug)
  const entry = WRITTEN[index]
  if (!doc || !entry) return <GuideMissing />
  const { image, authors, updated } = entry.lead

  return (
    <DetailPage>
      <title>{`${entry.title} · ${BRAND.full}`}</title>
      <DetailOpener photo={image.src} alt={image.alt}>
        <p className={styles.kicker} data-fog-clear>
          <Link to={PLAYBOOK_HREF}>{PLAYBOOK_INTRO.title}</Link>
          <span className={styles.kickerCount}>
            {GUIDE_PAGE.guideOf(index + 1, WRITTEN.length)}
          </span>
        </p>
        <h1 id="guide-title" className={styles.title} data-fog-clear>
          {entry.title}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {entry.line}
        </p>
        <div className={styles.byline}>
          <Byline authors={authors} updated={updated} copy={GUIDE_PAGE} />
        </div>
        <p className={styles.leadCredit} data-fog-clear>
          <Credit image={image} />
        </p>
      </DetailOpener>

      <div className={styles.layout}>
        <nav className={styles.contents} aria-labelledby="contents">
          <details className={styles.contentsFold} open={contentsOpen} onToggle={(event) => setContentsOpen(event.currentTarget.open)}>
            <summary className={styles.contentsSummary} data-fog-clear>
              <h2 id="contents" className={styles.contentsTitle}>
                {GUIDE_PAGE.contentsLabel}
              </h2>
              <span className={styles.contentsCount}>{GUIDE_PAGE.sections(doc.sections.length)}</span>
            </summary>
            <ol className={styles.contentsList}>
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} aria-current={active === section.id ? 'true' : undefined} data-fog-clear>
                    {section.title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#authors" aria-current={active === 'authors' ? 'true' : undefined} data-fog-clear>
                  {GUIDE_PAGE.authorsTitle}
                </a>
              </li>
            </ol>
          </details>
        </nav>

        <article className={`${ui.panelDeep} ${styles.doc}`} aria-labelledby="guide-title">
          <p className={styles.standfirst} data-fog-clear>
            <RichText text={doc.standfirst} />
          </p>
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`} className={styles.heading} data-fog-clear>
                {section.title}
              </h2>
              <SectionBody section={section} authors={authors} />
            </section>
          ))}
          <AuthorNote authors={authors} />
        </article>

        <UpNext index={index} />
      </div>
    </DetailPage>
  )
}
