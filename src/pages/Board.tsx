import { useLoaderData } from 'react-router'
import type { BoardMember } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD_EMPTY, BOARD_INTRO } from '../content/board'
import styles from './Board.module.css'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** A conference badge on a lanyard: punch hole, photo, name, role, links. */
function Badge({ member }: { member: BoardMember }) {
  return (
    <li className={styles.badge}>
      <span className={styles.hole} aria-hidden="true" />

      <div className={styles.photo}>
        {member.photo ? (
          <img src={member.photo} alt={member.name} loading="lazy" />
        ) : (
          <span aria-hidden="true">{initials(member.name)}</span>
        )}
      </div>

      <h3 className={styles.name} data-fog-clear>
        {member.name}
        <SampleTag show={member.placeholder} />
      </h3>
      <p className={styles.role} data-fog-clear>
        {member.role}
      </p>

      {member.links.length > 0 && (
        <ul className={styles.links}>
          {member.links.map((link) => (
            <li key={`${link.label}-${link.href}`}>
              <a className={ui.textLink} href={link.href} target="_blank" rel="noreferrer" data-fog-clear>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function Board() {
  const board = useLoaderData<BoardMember[]>()

  return (
    <div className={ui.page}>
      <PageIntro intro={BOARD_INTRO} />
      {board.length === 0 ? (
        <p className={ui.panel} data-fog-clear>
          {BOARD_EMPTY}
        </p>
      ) : (
        <ul className={styles.grid}>
          {board.map((member) => (
            <Badge key={member.id} member={member} />
          ))}
        </ul>
      )}
    </div>
  )
}
