import { LogoBand } from '../components/LogoBand'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { EMPTY_WALL, LOGO_WALLS, TRACK_RECORD_INTRO } from '../content/trackRecord'
import styles from './TrackRecord.module.css'

/** Empty slots drawn while a wall has no verified logos. */
const GHOST_SLOTS = 6

/** The logo wall, one section per kind. Only real, verified logos (see content/trackRecord.ts). */
export function TrackRecord() {
  return (
    <div className={ui.page}>
      <PageIntro intro={TRACK_RECORD_INTRO} />
      <LogoBand showLink={false} />

      <div className={styles.walls}>
        {LOGO_WALLS.map((wall, index) => (
          <section key={wall.id} className={ui.panel} aria-labelledby={`wall-${index}`}>
            <div className={styles.head}>
              <span className={styles.count} data-fog-clear>
                {String(wall.logos.length).padStart(2, '0')}
              </span>
              <div>
                <h2 id={`wall-${index}`} className={styles.title} data-fog-clear>
                  {wall.title}
                </h2>
                <p className={styles.text} data-fog-clear>
                  {wall.text}
                </p>
              </div>
            </div>

            {wall.logos.length > 0 ? (
              <ul className={styles.logos}>
                {wall.logos.map((logo) => {
                  const mark = logo.src ? (
                    <img src={logo.src} alt={logo.name} loading="lazy" />
                  ) : (
                    <span className={styles.wordmark} data-fog-clear>
                      {logo.name}
                    </span>
                  )
                  return (
                    <li key={logo.name} className={styles.logo}>
                      {logo.href ? (
                        <a href={logo.href} target="_blank" rel="noreferrer">
                          {mark}
                        </a>
                      ) : (
                        mark
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <>
                <ul className={styles.logos} aria-hidden="true">
                  {Array.from({ length: GHOST_SLOTS }, (_, slot) => (
                    <li key={slot} className={styles.ghost} />
                  ))}
                </ul>
                <p className={styles.empty} data-fog-clear>
                  {EMPTY_WALL}
                </p>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
