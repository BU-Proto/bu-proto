import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { GUIDES } from '../content/resources'
import { AT_SCHOOLS, BOSTON_WIDE, HUB_COPY, HUB_INTRO, orgHref, ORGS, PLAYBOOK_CARD, type HubCard, type OutsideLink } from '../content/resourcesHub'
import styles from './Resources.module.css'

/** The playbook's card wears its lead guide's photo. */
const PLAYBOOK_IMAGE = GUIDES.find((guide) => guide.lead)?.lead?.image

interface Card extends HubCard {
  image?: { src: string; thumb?: string }
}

const BU_CARDS: readonly Card[] = ORGS.map((org) => ({
  kicker: HUB_COPY.atBu,
  title: org.name,
  line: org.line,
  href: orgHref(org),
  image: { src: org.photo.src, thumb: org.photo.src.replace('/1920px-', '/960px-') },
}))

const CS_CARDS: readonly Card[] = [{ ...PLAYBOOK_CARD, image: PLAYBOOK_IMAGE }]

/** Cards set like the playbook's own: a picture over each title. */
function Cards({ cards }: { cards: readonly Card[] }) {
  return (
    <ul className={styles.cards} data-count={cards.length}>
      {cards.map((card) => (
        <li key={card.href}>
          <Link className={styles.card} to={card.href}>
            <span className={styles.image}>
              {card.image && <img src={card.image.thumb ?? card.image.src} alt="" loading="lazy" />}
            </span>
            <span className={styles.kicker}>{card.kicker}</span>
            <span className={styles.title}>{card.title}</span>
            <span className={styles.line}>{card.line}</span>
            <span className={styles.open}>
              {HUB_COPY.open} <span aria-hidden="true">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Other people's programs as ruled rows: whose it is, what it is, and a link out to their page. */
function Rows({ items }: { items: readonly OutsideLink[] }) {
  return (
    <ul className={styles.rows}>
      {items.map((item) => (
        <li key={item.href} className={styles.row}>
          <span className={styles.who}>{item.who}</span>
          <span className={styles.rowBody}>
            <a className={styles.rowName} href={item.href} target="_blank" rel="noopener noreferrer">
              {item.name}
              <span className={ui.srOnly}> ({HUB_COPY.visit})</span>
              <span aria-hidden="true"> ↗</span>
            </a>
            <span className={styles.rowText}>{item.text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The resources hub, for founders anywhere in Boston: what's open to anyone in the city, then what
 * each school runs for its own students (BU's two with pages of their own), then the CS group's
 * hackathon playbook. Each part is its own sheet with a heading.
 */
export function Resources() {
  return (
    <div className={ui.page}>
      <PageIntro intro={HUB_INTRO} />

      <section className={styles.sheet} aria-labelledby="boston-wide">
        <header className={styles.head}>
          <h2 id="boston-wide" className={styles.sectionTitle}>
            {HUB_COPY.boston.title}
          </h2>
          <p className={styles.sectionLine}>{HUB_COPY.boston.line}</p>
        </header>
        <Rows items={BOSTON_WIDE} />
      </section>

      <section className={styles.sheet} aria-labelledby="at-schools">
        <header className={styles.head}>
          <h2 id="at-schools" className={styles.sectionTitle}>
            {HUB_COPY.schools.title}
          </h2>
          <p className={styles.sectionLine}>{HUB_COPY.schools.line}</p>
        </header>
        <Cards cards={BU_CARDS} />
        <Rows items={AT_SCHOOLS} />
      </section>

      <section className={styles.sheet} aria-labelledby="from-cs">
        <header className={styles.head}>
          <h2 id="from-cs" className={styles.sectionTitle}>
            {HUB_COPY.cs.title}
          </h2>
          <p className={styles.sectionLine}>{HUB_COPY.cs.line}</p>
        </header>
        <Cards cards={CS_CARDS} />
      </section>

      <p className={styles.note} data-fog-clear>
        {HUB_COPY.note}
      </p>
    </div>
  )
}
