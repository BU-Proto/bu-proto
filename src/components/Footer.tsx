import { Link } from 'react-router'
import { BRAND, FOOTER, NAV_ITEMS } from '../content/site'
import styles from './Footer.module.css'

/** Every page again, and the working-name note. */
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
        </ul>
      </nav>
      <p className={styles.note} data-fog-clear>
        {FOOTER.note}
      </p>
    </footer>
  )
}
