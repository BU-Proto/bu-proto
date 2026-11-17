import { Link, useLoaderData } from 'react-router'
import type { Role } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { RoleList } from '../components/RoleList'
import ui from '../components/ui.module.css'
import { ROLES_ELSE, ROLES_EMPTY, ROLES_INTRO, ROLES_LIST } from '../content/roles'
import { roleIsOpen } from '../lib/roles'
import styles from './Roles.module.css'

/**
 * The parts of Proto that need someone, as a sign-up sheet. Each line opens the role's own page,
 * where the application is. A role past its apply-by day drops off on its own.
 */
export function Roles() {
  const roles = useLoaderData<Role[]>().filter(roleIsOpen)

  return (
    <div className={`${ui.page} ${styles.page}`}>
      <PageIntro intro={ROLES_INTRO} />

      {roles.length > 0 ? (
        <section className={styles.open} aria-labelledby="open-roles">
          <h2 id="open-roles" className={ui.sectionTitle}>
            {ROLES_LIST.title(roles.length)}
          </h2>
          <RoleList roles={roles} />
        </section>
      ) : (
        <section className={styles.empty} aria-labelledby="no-roles">
          <h2 id="no-roles" className={styles.emptyTitle}>
            {ROLES_EMPTY.title}
          </h2>
          <p className={styles.emptyText}>{ROLES_EMPTY.text}</p>
          <div className={styles.actions}>
            <Link className={ui.primary} to={ROLES_EMPTY.join.href}>
              {ROLES_EMPTY.join.label}
            </Link>
            <Link className={ui.textLink} to={ROLES_EMPTY.events.href}>
              {ROLES_EMPTY.events.label}
            </Link>
          </div>
        </section>
      )}

      <section className={styles.else} aria-labelledby="not-listed">
        <h2 id="not-listed" className={ui.sectionTitle}>
          {ROLES_ELSE.title}
        </h2>
        <div className={styles.elseText}>
          <p>
            {ROLES_ELSE.text}{' '}
            <a className={ui.textLink} href={`mailto:${ROLES_ELSE.email}`}>
              {ROLES_ELSE.email}
            </a>
          </p>
          <p>
            {ROLES_ELSE.board.lead}{' '}
            <Link className={ui.textLink} to={ROLES_ELSE.board.href}>
              {ROLES_ELSE.board.label}
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
