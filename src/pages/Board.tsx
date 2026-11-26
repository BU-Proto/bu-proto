import { useState, type ReactNode } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { BoardMember, Role } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD_CONTACT, BOARD_FORMING, BOARD_INTRO, OPEN_SEAT } from '../content/board'
import { PROTO_LINKEDIN } from '../content/site'
import type { BoardPageData } from '../lib/content'
import { Pictogram } from '../components/Pictogram'
import { rolePath } from '../lib/paths'
import { openSeats } from '../lib/roles'
import styles from './Board.module.css'

type MemberLink = BoardMember['links'][number]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

type LinkKind = 'linkedin' | 'github' | 'devpost' | 'luma' | 'instagram'

// Admins type whatever label they like ("Profile", "linkedin"), so the URL decides too.
const LINK_KINDS: readonly { kind: LinkKind; label: RegExp; host: RegExp }[] = [
  { kind: 'linkedin', label: /linkedin/i, host: /(^|\.)linkedin\.com$/i },
  { kind: 'github', label: /github/i, host: /(^|\.)github\.com$/i },
  { kind: 'devpost', label: /devpost/i, host: /(^|\.)devpost\.com$/i },
  { kind: 'luma', label: /\blu\.?ma\b/i, host: /(^|\.)(luma\.com|lu\.ma)$/i },
  { kind: 'instagram', label: /instagram/i, host: /(^|\.)instagram\.com$/i },
]

const linkKind = (link: MemberLink): LinkKind | null => {
  let host = ''
  try {
    host = new URL(link.href).hostname
  } catch {
    // Not a full URL: only the label can say what it is.
  }
  return LINK_KINDS.find((k) => k.host.test(host) || k.label.test(link.label))?.kind ?? null
}

const isLinkedIn = (link: MemberLink) => linkKind(link) === 'linkedin'

/** The mark for each kind of link, drawn in the text colour so it follows the theme. */
function LinkGlyph({ kind }: { kind: LinkKind }) {
  const svg = (viewBox: string, children: ReactNode) => (
    <svg className={styles.glyph} viewBox={viewBox} aria-hidden="true" focusable="false">
      {children}
    </svg>
  )

  switch (kind) {
    case 'linkedin':
      return svg(
        '0 0 16 16',
        <path
          fill="currentColor"
          d="M2 0h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2Zm1.6 6.1V13h2.2V6.1H3.6Zm1.1-3.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM7.3 6.1V13h2.2V9.4c0-1 .2-1.9 1.4-1.9s1.2 1.1 1.2 2V13h2.2V9.1c0-1.9-.4-3.2-2.6-3.2-1 0-1.8.5-2.1 1.1V6.1H7.3Z"
        />,
      )
    case 'github':
      return svg(
        '0 0 24 24',
        <path
          fill="currentColor"
          d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
        />,
      )
    case 'devpost':
      return svg(
        '0 0 24 24',
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M6 1.6 0 12l6 10.4h12L24 12 18 1.6H6Zm1.6 4.1h3.9c3.6 0 6.3 1.7 6.3 6.3 0 4.4-3.2 6.3-6.5 6.3H7.6V5.7Zm2.5 2.4v7.7h1.2c2.7 0 3.9-1.5 3.9-3.8 0-2.6-1.1-3.9-3.8-3.9h-1.3Z"
        />,
      )
    case 'luma':
      // An events calendar: Luma is where Proto's events and RSVPs live.
      return svg(
        '0 0 24 24',
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
          <path d="M3 10h18M8 2.5v4M16 2.5v4" />
        </g>,
      )
    case 'instagram':
      return svg(
        '0 0 24 24',
        <>
          <g fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
            <circle cx="12" cy="12" r="4.4" />
          </g>
          <circle cx="17.6" cy="6.4" r="1.4" fill="currentColor" />
        </>,
      )
  }
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
            {links.map((link) => {
              const kind = linkKind(link)
              return (
                <li key={`${link.label}-${link.href}`}>
                  <a className={styles.link} href={link.href} target="_blank" rel="noreferrer">
                    {kind && <LinkGlyph kind={kind} />}
                    {kind === 'linkedin' ? 'LinkedIn' : link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </li>
  )
}

/** Open seats take these colours in turn: a flat tile where the portrait would be. */
const SEAT_TONES = ['sky', 'iris', 'rose', 'amber', 'mint'] as const

/**
 * A seat nobody has taken yet, laid out like a member so the board reads as one table: a colour
 * tile with an empty chair where the portrait would be, the role where the name would be. The button goes to the
 * seat's own role page, where the application is.
 */
function Vacancy({ seat, tone }: { seat: Role; tone: (typeof SEAT_TONES)[number] }) {
  return (
    <li className={`${styles.seat} ${styles.vacancy}`}>
      <div className={styles.empty} data-tone={tone} aria-hidden="true">
        <Pictogram name="seat" className={styles.seatPicture} />
      </div>
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
                <LinkGlyph kind="linkedin" />
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

        <ul className={styles.grid} data-grid>
          {board.map((member) => (
            <Member key={member.id} member={member} />
          ))}
          {open.map((item, index) => (
            <Vacancy key={item.id} seat={item} tone={SEAT_TONES[index % SEAT_TONES.length]!} />
          ))}
        </ul>
      </section>
    </div>
  )
}
