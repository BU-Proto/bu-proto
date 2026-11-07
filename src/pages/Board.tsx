import { useRef, useState, type MouseEvent } from 'react'
import { useLoaderData } from 'react-router'
import type { BoardMember } from '../../shared/api'
import { BOARD_SEATS, YEARS, type BoardSeat } from '../../shared/constants'
import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { MaskLines } from '../components/motion/MaskLines'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { ProtoMark } from '../components/ProtoMark'
import { Select } from '../components/Select'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD_CONTACT, BOARD_FORM, BOARD_FORMING, BOARD_INTRO, BOARD_THANKS, OPEN_SEAT, OPEN_SEATS } from '../content/board'
import { PROTO_LINKEDIN } from '../content/site'
import { api } from '../lib/api'
import { reducedMotion } from '../lib/useInView'
import styles from './Board.module.css'

type MemberLink = BoardMember['links'][number]
type OpenSeat = (typeof OPEN_SEATS)[number]

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

// A member whose role names a seat ("Head of the Fund", "Head of Growth and socials") fills it.
const fills = (member: BoardMember, seat: OpenSeat) =>
  member.role.toLowerCase().includes(seat.role.toLowerCase().replace(/^the /, ''))

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

/** A portrait, or the member's initials on navy when there's none or it won't load. */
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
    <li className={styles.seat} data-reveal>
      <Portrait member={member} />
      <div className={styles.text}>
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
 * frame where the portrait would be, the role where the name would be.
 */
function Vacancy({ seat, onPick }: { seat: OpenSeat; onPick: (seat: BoardSeat) => void }) {
  const pick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onPick(seat.role)
  }

  return (
    <li className={`${styles.seat} ${styles.vacancy}`} data-reveal>
      <div className={styles.empty} aria-hidden="true">
        <ProtoMark size={28} />
      </div>
      <div className={styles.text}>
        <h3 className={styles.name}>
          {seat.role}
        </h3>
        <p className={`${ui.tag} ${ui.tagNeon} ${styles.status}`}>
          {OPEN_SEAT.status}
        </p>
        <p className={styles.detail}>
          {seat.detail}
        </p>
        {/* A plain anchor underneath, so it still lands on the form without JS. */}
        <a className={`${ui.secondary} ${styles.pick}`} href={`#${BOARD_FORM.id}`} onClick={pick}>
          {OPEN_SEAT.cta}
          <span className={ui.srOnly}> for {seat.role}</span>
        </a>
      </div>
    </li>
  )
}

export function Board() {
  const board = useLoaderData<BoardMember[]>()
  const open = OPEN_SEATS.filter((seat) => !board.some((member) => fills(member, seat)))
  // Only the seats still open, plus Not sure yet, are worth offering in the form.
  const seatOptions = BOARD_SEATS.filter((seat) => seat === 'Not sure yet' || open.some((item) => item.role === seat))
  const [seat, setSeat] = useState<BoardSeat | ''>('')
  const formRef = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const revealRef = useReveal<HTMLUListElement>()

  const pick = (role: BoardSeat) => {
    setSeat(role)
    formRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    // The seat is chosen for them, so the next thing to type is their name. Not on touch screens,
    // where focusing would throw the keyboard up over the scroll.
    if (window.matchMedia('(pointer: fine)').matches) nameRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className={ui.page}>
      <PageIntro intro={BOARD_INTRO}>
        <div className={styles.contact}>
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
          <div className={ui.split}>
            <h2 id="board-seats" className={ui.h2}>
              <MaskLines text={BOARD_FORMING.title} />
            </h2>
            <p className={ui.body}>{BOARD_FORMING.text}</p>
          </div>
        ) : (
          <h2 id="board-seats" className={ui.srOnly}>
            {BOARD_FORMING.filledTitle}
          </h2>
        )}

        <ul ref={revealRef} className={`${motion.reveal} ${styles.grid}`}>
          {board.map((member) => (
            <Member key={member.id} member={member} />
          ))}
          {open.map((item) => (
            <Vacancy key={item.role} seat={item} onPick={pick} />
          ))}
        </ul>
      </section>

      {open.length > 0 && (
        <section ref={formRef} id={BOARD_FORM.id} className={`${ui.split} ${styles.apply}`} aria-labelledby="board-form">
          <div className={styles.applyLead}>
            <h2 id="board-form" className={ui.h2}>
              <MaskLines text={BOARD_FORM.title} />
            </h2>
            <p className={ui.body}>{BOARD_FORM.text}</p>
            <PrivacyNote text={BOARD_FORM.privacy} className={styles.privacy} />
          </div>
          <Form
            submitLabel={BOARD_FORM.submit}
            thanks={BOARD_THANKS}
            turnstile="board-interest"
            onSubmit={(values) => api<{ ok: true }>('/board-interest', { body: values })}
          >
            <Field label="Name" wide>
              <input ref={nameRef} className={inputClass} name="name" autoComplete="name" maxLength={80} required />
            </Field>
            <Field label="BU email" wide>
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@bu.edu"
                pattern={BU_EMAIL_PATTERN}
                title="Use your @bu.edu address"
                required
              />
            </Field>
            <Field label="Year">
              <Select name="year" options={YEARS} required />
            </Field>
            <Field label="Seat">
              <Select name="role" options={seatOptions} required value={seat} onChange={setSeat} />
            </Field>
            <Field label="What you’d take on" hint="Optional. A few lines is plenty." wide>
              <textarea className={inputClass} name="note" maxLength={1000} rows={4} />
            </Field>
          </Form>
        </section>
      )}
    </div>
  )
}
