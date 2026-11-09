import { useMemo, useState, type CSSProperties } from 'react'
import { useLoaderData } from 'react-router'
import type { Hackathon } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import { Status } from '../components/Status'
import ui from '../components/ui.module.css'
import { CARD, HACKATHONS_EMPTY, HACKATHONS_INTRO, MODE_LABEL, TRAVEL_NOTE } from '../content/hackathons'
import { daysUntil, formatDay, formatMonth, formatRange } from '../lib/dates'
import { glyphTexture, hash } from '../lib/glyphArt'
import { statusOf } from '../lib/hackathons'
import styles from './Hackathons.module.css'

/** Frost, a little brighter than the page texture, so a card without a photo still has a ground. */
const FALLBACK_INK = 'rgba(246, 251, 255, 0.16)'

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

function HackathonCard({ hackathon, texture }: { hackathon: Hackathon; texture: string }) {
  const host = hackathon.href ? hostOf(hackathon.href) : ''
  const [place, mode] = placeLine(hackathon)
  // Each fallback card shows a different stretch of the frozen field, so a row of them isn't a
  // row of copies.
  const offset = `${Math.round(hash(hackathon.id, 3) * 595)}px ${Math.round(hash(3, hackathon.id) * 400)}px`
  // MLH renames its images now and then, so an imported link can go dead: fall back, don't break.
  const [failed, setFailed] = useState({ photo: false, logo: false })
  const photo = failed.photo ? null : hackathon.photo
  const logo = failed.logo ? null : hackathon.logo

  return (
    <li className={styles.card} data-linked={host !== ''} data-fog-clear="box">
      <div
        className={styles.art}
        data-photo={photo ? '' : undefined}
        style={{ '--texture': texture ? `url(${texture})` : 'none', '--offset': offset } as CSSProperties}
        aria-hidden="true"
      >
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
  const texture = useMemo(() => glyphTexture(FALLBACK_INK), [])
  const months = new Map<string, Hackathon[]>()
  for (const hackathon of hackathons
    .filter((item) => daysUntil(item.ends) >= 0)
    .toSorted((a, b) => a.starts.localeCompare(b.starts) || a.id - b.id)) {
    const month = formatMonth(hackathon.starts)
    months.set(month, [...(months.get(month) ?? []), hackathon])
  }

  return (
    // The trips are the month's beat, so the page is in iris (see the palette in index.css).
    <div className={ui.page} data-hue="iris">
      <PageIntro intro={HACKATHONS_INTRO} />

      {months.size === 0 && (
        <p className={ui.panel} data-fog-clear>
          {HACKATHONS_EMPTY}
        </p>
      )}

      {[...months].map(([month, items]) => (
        <section key={month} className={styles.month} aria-label={month}>
          <h2 className={styles.monthName} data-fog-clear>
            {month}
          </h2>
          <ul className={styles.grid}>
            {items.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} texture={texture} />
            ))}
          </ul>
        </section>
      ))}

      <p className={styles.footnote} data-fog-clear>
        {TRAVEL_NOTE}
      </p>
    </div>
  )
}
