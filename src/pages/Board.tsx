import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { BoardMember, Role } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD_CONTACT, BOARD_FORMING, BOARD_INTRO, OPEN_SEAT } from '../content/board'
import { PROTO_LINKEDIN } from '../content/site'
import type { BoardPageData } from '../lib/content'
import { glyphTexture } from '../lib/glyphArt'
import { rolePath } from '../lib/paths'
import { openSeats } from '../lib/roles'
import styles from './Board.module.css'

type MemberLink = BoardMember['links'][number]

// Faint enough that the empty frame reads as a gap in the board, not a picture.
const EMPTY_INK = 'rgba(246, 251, 255, 0.4)'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

// Admins type whatever label they like ("Profile", "linkedin"), so the URL decides too.
const isLinkedIn = (link: MemberLink) => {
  if (/linkedin/i.test(link.label)) return true
  try {
    return /(^|\.)linkedin\.com$/i.test(new URL(link.href).hostname)
  } catch {
    return false
  }
}

function LinkedInGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M2 0h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2Zm1.6 6.1V13h2.2V6.1H3.6Zm1.1-3.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM7.3 6.1V13h2.2V9.4c0-1 .2-1.9 1.4-1.9s1.2 1.1 1.2 2V13h2.2V9.1c0-1.9-.4-3.2-2.6-3.2-1 0-1.8.5-2.1 1.1V6.1H7.3Z"
      />
    </svg>
  )
}

/** A portrait, or the member's initials on a quiet gradient when there's none or it won't load. */
function Portrait({ member }: { member: BoardMember }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = member.photo && !failed

  return (
    <div className={styles.portrait}>
      {showPhoto ? (
        <img
          src={member.photo!}
          alt={`${member.name}, ${member.role}`}
          loading="lazy"
          decoding="async"
          // Photos may be hotlinked from anywhere; don't leak which page they're shown on.
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {initials(member.name)}
        </span>
      )}
    </div>
  )
}

function Member({ member }: { member: BoardMember }) {
  // LinkedIn first: it's the link people come here for.
  const links = [...member.links].sort((a, b) => Number(isLinkedIn(b)) - Number(isLinkedIn(a)))

  return (
    <li className={styles.seat}>
      <Portrait member={member} />
      <div className={styles.text} data-fog-clear>
        <h3 className={styles.name}>
          {member.name}
          <SampleTag show={member.placeholder} />
        </h3>
        <p className={styles.role}>{member.role}</p>
        {links.length > 0 && (
          <ul className={styles.links} aria-label={`${member.name}’s links`}>
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a className={styles.link} href={link.href} target="_blank" rel="noreferrer">
                  {isLinkedIn(link) ? (
                    <>
                      <LinkedInGlyph />
                      LinkedIn
                    </>
                  ) : (
                    link.label
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

/**
 * A seat nobody has taken yet, laid out like a member so the board reads as one table: an empty
 * frame where the portrait would be, the role where the name would be. The button goes to the
 * seat's own role page, where the application is.
 */
function Vacancy({ seat, texture }: { seat: Role; texture: string }) {
  return (
    <li className={`${styles.seat} ${styles.vacancy}`}>
      <div
        className={styles.empty}
        style={texture ? ({ '--texture': `url(${texture})` } as CSSProperties) : undefined}
        aria-hidden="true"
      />
      <div className={styles.text}>
        <h3 className={styles.name} data-fog-clear>
          {seat.title}
        </h3>
        <p className={styles.status} data-fog-clear>
          {OPEN_SEAT.status}
        </p>
        {seat.summary && (
          <p className={styles.detail} data-fog-clear>
            {seat.summary}
          </p>
        )}
        <Link className={`${ui.secondary} ${styles.pick}`} to={rolePath(seat)} data-fog-clear="box">
          {OPEN_SEAT.cta}
          <span className={ui.srOnly}>: {seat.title}</span>
        </Link>
      </div>
    </li>
  )
}

export function Board() {
  const { board, roles } = useLoaderData<BoardPageData>()
  const texture = useMemo(() => glyphTexture(EMPTY_INK), [])
  // A seat is open until its role is marked filled in the portal.
  const open = openSeats(roles)

  return (
    <div className={ui.page}>
      <PageIntro intro={BOARD_INTRO}>
        <div className={styles.contact} data-fog-clear>
          <p>
            {BOARD_CONTACT.lead}{' '}
            <a className={ui.textLink} href={`mailto:${BOARD_CONTACT.email}`}>
              {BOARD_CONTACT.email}
            </a>
          </p>
          {PROTO_LINKEDIN && (
            <p>
              <a className={ui.textLink} href={PROTO_LINKEDIN} target="_blank" rel="noreferrer">
                <LinkedInGlyph />
                {BOARD_CONTACT.linkedin}
                <span aria-hidden="true">↗</span>
              </a>
            </p>
          )}
        </div>
      </PageIntro>

      <section className={styles.board} aria-labelledby="board-seats">
        {open.length > 0 ? (
          <div className={styles.lead}>
            <h2 id="board-seats" className={styles.leadTitle} data-fog-clear>
              {BOARD_FORMING.title}
            </h2>
            <p className={styles.leadText} data-fog-clear>
              {BOARD_FORMING.text(open.length)}
            </p>
          </div>
        ) : (
          <h2 id="board-seats" className={ui.srOnly}>
            {BOARD_FORMING.filledTitle}
          </h2>
        )}

        <ul className={styles.grid}>
          {board.map((member) => (
            <Member key={member.id} member={member} />
          ))}
          {open.map((item) => (
            <Vacancy key={item.id} seat={item} texture={texture} />
          ))}
        </ul>
      </section>
    </div>
  )
}
