import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { BOARD, BOARD_INTRO, type BoardMember } from '../content/board'
import { BRAND } from '../content/site'
import styles from './Board.module.css'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** A conference badge on a lanyard: punch hole, photo, name, role, links. */
function Badge({ member, index }: { member: BoardMember; index: number }) {
  return (
    <li className={styles.badge}>
      <span className={styles.hole} aria-hidden="true" />
      <p className={styles.org} data-fog-clear>
        <img src={BRAND.seal} alt="" width={14} height={14} />
        {BRAND.full}
        <span className={styles.no}>#{String(index + 1).padStart(3, '0')}</span>
      </p>

      <div className={styles.photo}>
        {member.photo ? (
          <img src={member.photo} alt={member.name} loading="lazy" />
        ) : (
          <span aria-hidden="true">{initials(member.name)}</span>
        )}
      </div>

      <h3 className={styles.name} data-fog-clear>
        {member.name}
      </h3>
      <p className={styles.role} data-fog-clear>
        {member.role}
      </p>
      <SampleTag show={member.placeholder} />

      {member.links.length > 0 && (
        <ul className={styles.links}>
          {member.links.map((link) => (
            <li key={link.href}>
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
  return (
    <div className={ui.page}>
      <PageIntro intro={BOARD_INTRO} />
      <ul className={styles.grid}>
        {BOARD.map((member, index) => (
          <Badge key={`${member.role}-${index}`} member={member} index={index} />
        ))}
      </ul>
    </div>
  )
}
