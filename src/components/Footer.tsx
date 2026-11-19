import { NavLink } from 'react-router'
import { CONTACT_EMAIL, LEGAL_LINKS } from '../content/legal'
import { BRAND, FOOTER, PROTO_LINKEDIN } from '../content/site'
import styles from './Footer.module.css'

/**
 * One block: who we are on the left, the site sorted into columns beside it. Each link to a page
 * of the site marks itself current on that page (exactly that page, not the pages under it).
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.about}>
        <p className={styles.brand} data-fog-clear>
          <img src={BRAND.seal} alt="" width={20} height={20} />
          {BRAND.name}
        </p>
        <p className={styles.line} data-fog-clear>
          {FOOTER.line}
        </p>
        <p className={styles.note} data-fog-clear>
          {FOOTER.note}
        </p>
      </div>

      <nav className={styles.columns} aria-label="Footer">
        {FOOTER.groups.map((group) => (
          <div key={group.title} className={styles.column}>
            <h2 className={styles.title} data-fog-clear>
              {group.title}
            </h2>
            <ul className={styles.links}>
              {group.links.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end data-fog-clear>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className={styles.column}>
          <h2 className={styles.title} data-fog-clear>
            Contact
          </h2>
          <ul className={styles.links}>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} data-fog-clear>
                {CONTACT_EMAIL}
              </a>
            </li>
            {PROTO_LINKEDIN && (
              <li>
                <a href={PROTO_LINKEDIN} target="_blank" rel="noreferrer" data-fog-clear>
                  LinkedIn <span aria-hidden="true">↗</span>
                </a>
              </li>
            )}
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <NavLink to={item.href} end data-fog-clear>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </footer>
  )
}
