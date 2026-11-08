import { Link } from 'react-router'
import { JOIN_CTA } from '../content/home'
import { CONTACT_EMAIL, LEGAL_LINKS } from '../content/legal'
import { BRAND, FOOTER } from '../content/site'
import { AsciiFigure } from './motion/AsciiFigure'
import { MaskLines } from './motion/MaskLines'
import { ProtoMark } from './ProtoMark'
import ui from './ui.module.css'
import styles from './JoinFrame.module.css'

/** The landing's last screen: the ask, then the site's links, on the plain black ground. */
export function JoinFrame() {
  return (
    <section className={styles.frame} aria-labelledby="join-cta">
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id="join-cta" className={styles.title}>
            <MaskLines text={JOIN_CTA.title} />
            <span className={styles.star} aria-hidden="true">
              *
            </span>
          </h2>
          <p className={styles.tag}>{JOIN_CTA.tag}</p>
        </header>

        <div className={styles.stage}>
          <div className={styles.hint}>
            <span className={styles.hintGlyph} aria-hidden="true">
              {'>_'}
            </span>
            <p className={styles.hintLine}>{JOIN_CTA.hint}</p>
          </div>

          <div className={styles.ring}>
            <AsciiFigure shape="halo" rows={24} className={styles.figure} />
            <Link className={`${ui.btn} ${styles.cta}`} to={JOIN_CTA.cta.href}>
              {JOIN_CTA.cta.label}
            </Link>
          </div>

          <p className={styles.aside}>
            {JOIN_CTA.aside.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        <p className={styles.lede}>{JOIN_CTA.lede}</p>

        <p className={styles.note}>
          {JOIN_CTA.footnote.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>

      <footer className={styles.foot}>
        <div className={styles.footRow}>
          <p className={styles.brand}>
            <ProtoMark size={16} />
            {BRAND.full}
          </p>
          <nav aria-label="Footer">
            <ul className={styles.links}>
              {FOOTER.groups
                .flatMap((group) => group.links)
                .filter((item, index, all) => all.findIndex((other) => other.to === item.to) === index)
                .map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <p className={styles.small}>{FOOTER.note}</p>
      </footer>
    </section>
  )
}
