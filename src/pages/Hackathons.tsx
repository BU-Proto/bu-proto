import { useState, type CSSProperties } from 'react'
import { useLoaderData } from 'react-router'
import type { Hackathon } from '../../shared/api'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import { Status } from '../components/Status'
import ui from '../components/ui.module.css'
import { CARD, HACKATHONS_EMPTY, HACKATHONS_INTRO, MODE_LABEL, TRAVEL_NOTE } from '../content/hackathons'
import { daysUntil, formatDay, formatMonth, formatRange } from '../lib/dates'
import { hash } from '../lib/glyphArt'
import { statusOf } from '../lib/hackathons'
import styles from './Hackathons.module.css'

/** How many solid grounds a card without a photo can fall on (see Hackathons.module.css). */
const FALLBACK_TONES = 4

/** "hackrpi.com" from its URL, so the card says where it goes. */
function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Where it is and how it's run. "Online" once, not as both the city and the format. */
function placeLine(hackathon: Hackathon): string[] {
  if (hackathon.mode === 'online') return [MODE_LABEL.online]
  return [hackathon.location, MODE_LABEL[hackathon.mode]]
}

function HackathonCard({ hackathon, index }: { hackathon: Hackathon; index: number }) {
  const host = hackathon.href ? hostOf(hackathon.href) : ''
  const [place, mode] = placeLine(hackathon)
  // Each fallback card lands on its own colour, so a row of them isn't a row of copies.
  const tone = Math.floor(hash(hackathon.id, 3) * FALLBACK_TONES)
  // MLH renames its images now and then, so an imported link can go dead: fall back, don't break.
  const [failed, setFailed] = useState({ photo: false, logo: false })
  const photo = failed.photo ? null : hackathon.photo
  const logo = failed.logo ? null : hackathon.logo

  return (
    <li
      className={styles.card}
      data-linked={host !== ''}
      data-reveal
      style={{ '--d': `${(index % 3) * 70}ms` } as CSSProperties}
    >
      <div className={styles.art} data-photo={photo ? '' : undefined} data-tone={tone} aria-hidden="true">
        {photo && (
          <img
            className={styles.photo}
            src={photo}
            alt=""
            width={640}
            height={360}
            loading="lazy"
            decoding="async"
            onError={() => setFailed((current) => ({ ...current, photo: true }))}
          />
        )}
        {/* No logo to show: the name stands in for one, so the card isn't a blank ground. */}
        {!logo && <span className={styles.wordmark}>{hackathon.name}</span>}
        {logo && (
          <img
            className={styles.logo}
            src={logo}
            alt=""
            width={200}
            height={200}
            loading="lazy"
            decoding="async"
            onError={() => setFailed((current) => ({ ...current, logo: true }))}
          />
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>
          {host ? (
            // Stretched over the card: a click anywhere opens the hackathon's own site.
            <a className={styles.cardLink} href={hackathon.href} target="_blank" rel="noopener noreferrer">
              {hackathon.name}
              <span className={ui.srOnly}> {CARD.newTab}</span>
            </a>
          ) : (
            hackathon.name
          )}
          <SampleTag show={hackathon.placeholder} />
        </h3>
        <p className={styles.when}>{formatRange(hackathon.starts, hackathon.ends)}</p>
        <p className={styles.where}>
          <span>{place}</span>
          {mode && <span className={styles.mode}>{mode}</span>}
        </p>

        <dl className={styles.facts}>
          <div>
            <dt>{CARD.applyBy}</dt>
            <dd>
              {formatDay(hackathon.applyBy)}
              <Status status={statusOf(hackathon)} />
            </dd>
          </div>
          <div>
            <dt>{CARD.travel}</dt>
            <dd data-covered={hackathon.travelCovered}>{hackathon.travelCovered ? CARD.covered : CARD.notConfirmed}</dd>
          </div>
        </dl>
        {hackathon.buGoing > 0 && <p className={styles.going}>{CARD.going(hackathon.buGoing)}</p>}

        {host && <p className={styles.host}>{host}</p>}
      </div>
    </li>
  )
}

/** Upcoming hackathons as cards, grouped by the month they start in. */
export function Hackathons() {
  const hackathons = useLoaderData<Hackathon[]>()
  const root = useReveal<HTMLDivElement>()
  const months = new Map<string, Hackathon[]>()
  for (const hackathon of hackathons
    .filter((item) => daysUntil(item.ends) >= 0)
    .toSorted((a, b) => a.starts.localeCompare(b.starts) || a.id - b.id)) {
    const month = formatMonth(hackathon.starts)
    months.set(month, [...(months.get(month) ?? []), hackathon])
  }

  return (
    <div ref={root} className={`${ui.page} ${motion.reveal}`}>
      <PageIntro intro={HACKATHONS_INTRO} />

      {months.size === 0 && (
        <p className={ui.panel}>{HACKATHONS_EMPTY}</p>
      )}

      {[...months].map(([month, items]) => (
        <section key={month} className={styles.month} aria-label={month}>
          <h2 className={styles.monthName}>{month}</h2>
          <ul className={styles.grid}>
            {items.map((hackathon, index) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} index={index} />
            ))}
          </ul>
        </section>
      ))}

      <p className={`${ui.small} ${styles.footnote}`}>{TRAVEL_NOTE}</p>
    </div>
  )
}
