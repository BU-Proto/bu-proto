import { Link } from 'react-router'
import { CONTACT_EMAIL, LEGAL_LINKS } from '../content/legal'
import { BRAND, FOOTER, PROTO_LINKEDIN } from '../content/site'
import { PixelSkyline } from './PixelSkyline'
import { ProtoMark } from './ProtoMark'
import ui from './ui.module.css'
import styles from './Footer.module.css'

/** Who we are and the site sorted into columns, over a low pixel skyline with the way in. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <p className={styles.brand}>
            <ProtoMark size={18} />
            {BRAND.full}
          </p>
          <p className={styles.line}>{FOOTER.line}</p>
          <p className={styles.note}>{FOOTER.note}</p>
        </div>

        <nav className={styles.columns} aria-label="Footer">
          {FOOTER.groups.map((group) => (
            <div key={group.title}>
              <h2 className={styles.title}>{group.title}</h2>
              <ul className={styles.links}>
                {group.links.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className={styles.title}>Contact</h2>
            <ul className={styles.links}>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
                  {CONTACT_EMAIL}
                </a>
              </li>
              {PROTO_LINKEDIN && (
                <li>
                  <a href={PROTO_LINKEDIN} target="_blank" rel="noreferrer">
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </li>
              )}
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className={styles.skyline}>
        <PixelSkyline className={styles.canvas} />
        <Link className={`${ui.btn} ${styles.join}`} to="/join">
          Join Proto
        </Link>
      </div>
    </footer>
  )
}
