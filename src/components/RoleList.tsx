import { Link } from 'react-router'
import type { Role } from '../../shared/api'
import { ROLES_LIST } from '../content/roles'
import { deadlineOf } from '../lib/roles'
import { SampleTag } from './SampleTag'
import styles from './RoleList.module.css'

/**
 * Roles as a sign-up sheet: one ruled line each, what it is on the left, what it takes in the
 * middle, and a blank at the end of the line for a name. The whole line opens the role's page.
 */
export function RoleList({ roles, compact }: { roles: readonly Role[]; compact?: boolean }) {
  return (
    <ul className={`${styles.list} ${compact ? styles.compact : ''}`}>
      {roles.map((role) => (
        <RoleRow key={role.id} role={role} />
      ))}
    </ul>
  )
}

function RoleRow({ role }: { role: Role }) {
  const deadline = deadlineOf(role, ROLES_LIST.untilFilled)

  return (
    <li className={styles.role}>
      <div className={styles.what}>
        <h3 className={styles.title}>
          {/* Stretched over the whole line, so a click anywhere on it opens the role. */}
          <Link className={styles.link} to={`/roles/${role.id}`}>
            {role.title}
          </Link>
          <SampleTag show={role.placeholder} />
        </h3>
        {role.summary && <p className={styles.summary}>{role.summary}</p>}
      </div>

      <p className={styles.terms}>
        {role.team && <span className={styles.team}>{role.team}</span>}
        {role.commitment && <span>{role.commitment}</span>}
        <span className={deadline.soon ? styles.soon : styles.deadline}>{deadline.text}</span>
      </p>

      {/* The blank on the sheet. Decoration for the link above, so it's hidden from readers. */}
      <span className={styles.slot} aria-hidden="true">
        {ROLES_LIST.cta}
        <span className={styles.arrow}>→</span>
      </span>
    </li>
  )
}
