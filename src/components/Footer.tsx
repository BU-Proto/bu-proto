import { Link } from 'react-router'
import { LEGAL_LINKS } from '../content/legal'
import { BRAND, FOOTER, NAV_ITEMS, PROTO_LINKEDIN } from '../content/site'
import styles from './Footer.module.css'

/** Every page again, the working-name note, and the legal pages on the note's line. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand} data-fog-clear>
        <img src={BRAND.seal} alt="" width={20} height={20} />
        {BRAND.full}
      </p>
      <nav aria-label="Footer">
        <ul className={styles.links}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link to={item.to} data-fog-clear>
                {item.label}
              </Link>
            </li>
          ))}
          {PROTO_LINKEDIN && (
            <li>
              <a href={PROTO_LINKEDIN} target="_blank" rel="noreferrer" data-fog-clear>
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </li>
          )}
        </ul>
      </nav>
      <div className={styles.fine}>
        <p className={styles.note} data-fog-clear>
          {FOOTER.note}
        </p>
        <nav aria-label="Legal">
          <ul className={styles.legal}>
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link to={item.href} data-fog-clear>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
