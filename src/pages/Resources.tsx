import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { GUIDES } from '../content/resources'
import { HUB_COPY, HUB_INTRO, orgHref, ORGS, PLAYBOOK_CARD, type HubCard } from '../content/resourcesHub'
import styles from './Resources.module.css'

/** The playbook's card wears its lead guide's photo. */
const PLAYBOOK_IMAGE = GUIDES.find((guide) => guide.lead)?.lead?.image

interface Card extends HubCard {
  image?: { src: string; thumb?: string }
}

const CARDS: readonly Card[] = [
  { ...PLAYBOOK_CARD, image: PLAYBOOK_IMAGE },
  ...ORGS.map((org) => ({
    kicker: HUB_COPY.atBu,
    title: org.name,
    line: org.line,
    href: orgHref(org),
    image: { src: org.photo.src, thumb: org.photo.src.replace('/1920px-', '/960px-') },
  })),
]

/**
 * The resources hub: one card each for the playbook, Spark! and Innovate@BU, set like the
 * playbook's own cards, a picture over each title. Everything else is on their own pages.
 */
export function Resources() {
  return (
    <div className={ui.page}>
      <PageIntro intro={HUB_INTRO} />

      <section className={styles.sheet} aria-label={HUB_COPY.cardsLabel}>
        <ul className={styles.cards}>
          {CARDS.map((card) => (
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
      </section>

      <p className={styles.note} data-fog-clear>
        {HUB_COPY.note}
      </p>
    </div>
  )
}
