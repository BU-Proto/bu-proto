import { Link } from 'react-router'
import { AsciiField, DEFAULT_FIELD_SETTINGS, type FieldSettings } from '../ascii-field'
import { HERO_COPY } from '../content/home'
import ui from './ui.module.css'
import styles from './Hero.module.css'

/** The landing's field as it was before the redesign: currents of light bundled on the left and
    spreading across the top. Slower waves, softer glyphs, shallower ribs, in slightly bigger cells. */
const HOME_FIELD: FieldSettings = {
  ...DEFAULT_FIELD_SETTINGS,
  shape: 'tides',
  cellSize: 10,
  baseColor: 0.82,
  glyphContrast: 0.42,
  ribbing: 0.3,
  drift: 0.55,
}

/**
 * The home hero: who Proto is and the two ways in, set low over the ASCII field, whose characters
 * the cursor drags and splashes. Below the hero the page's black rises over the field.
 */
export function Hero() {
  const { headline, lede, primaryCta, secondaryCta } = HERO_COPY

  return (
    <>
      <AsciiField settings={HOME_FIELD} className={styles.field} />
      {/* The field draws its own trail; the site's trail layer steps back over it (see Layout). */}
      <span className={styles.fieldZone} data-trail-skip aria-hidden="true" />
      {/* Opaque, so the field pauses once it fills the screen (see the engine's data-field-cover). */}
      <div className={styles.ground} data-field-cover aria-hidden="true" />

      <section className={styles.hero}>
        <h1 className={styles.headline} data-fog-clear>
          {headline}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {lede}
        </p>
        <div className={styles.ctas}>
          <Link className={`${ui.primary} ${styles.primary}`} to={primaryCta.href} data-fog-clear="box">
            {primaryCta.label}
          </Link>
          <Link className={ui.textLink} to={secondaryCta.href} data-fog-clear>
            {secondaryCta.label}
          </Link>
        </div>
      </section>
    </>
  )
}
