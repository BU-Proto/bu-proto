import { useState } from 'react'
import { useLoaderData } from 'react-router'
import type { BoardMember } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD_CONTACT, BOARD_FORMING, BOARD_INTRO } from '../content/board'
import { PROTO_LINKEDIN } from '../content/site'
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
    <li className={styles.member}>
      <Portrait member={member} />
      <div className={styles.text} data-fog-clear>
        <h2 className={styles.name}>
          {member.name}
          <SampleTag show={member.placeholder} />
        </h2>
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

export function Board() {
  const board = useLoaderData<BoardMember[]>()

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

      {board.length === 0 ? (
        <section className={styles.forming} aria-labelledby="board-forming">
          <div className={styles.formingLead}>
            <h2 id="board-forming" className={styles.formingTitle} data-fog-clear>
              {BOARD_FORMING.title}
            </h2>
            <p className={styles.formingText} data-fog-clear>
              {BOARD_FORMING.text}
            </p>
            <a
              className={ui.primary}
              href={`mailto:${BOARD_CONTACT.email}?subject=${encodeURIComponent(BOARD_FORMING.subject)}`}
              data-fog-clear="box"
            >
              {BOARD_FORMING.cta}
            </a>
          </div>
          <div>
            <h3 className={styles.rolesLabel} data-fog-clear>
              {BOARD_FORMING.rolesLabel}
            </h3>
            <ul className={styles.roles}>
              {BOARD_FORMING.roles.map((item) => (
                <li key={item.role}>
                  <span className={styles.roleName} data-fog-clear>
                    {item.role}
                  </span>
                  <span className={styles.roleDetail} data-fog-clear>
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <ul className={styles.grid}>
          {board.map((member) => (
            <Member key={member.id} member={member} />
          ))}
        </ul>
      )}
    </div>
  )
}
