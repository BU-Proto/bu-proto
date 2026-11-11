import { Link, useLocation } from 'react-router'
import { CONTACT_EMAIL, LEGAL_LINKS } from '../content/legal'
import { BRAND, FOOTER, PROTO_LINKEDIN } from '../content/site'
import styles from './Footer.module.css'

/**
 * One block: who we are on the left, the site sorted into columns beside it. On the landing it
 * takes the landing's margins, like the top bar, so it ends where everything above it does.
 */
export function Footer() {
  const wide = useLocation().pathname === '/'
  return (
    <footer className={styles.footer} data-wide={wide || undefined}>
      <div className={styles.about}>
        <p className={styles.brand} data-fog-clear>
          <img src={BRAND.seal} alt="" width={20} height={20} />
          {BRAND.full}
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
                  <Link to={item.to} data-fog-clear>
                    {item.label}
                  </Link>
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
                <Link to={item.href} data-fog-clear>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </footer>
  )
}
