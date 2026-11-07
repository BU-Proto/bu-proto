import { LogoBand } from '../components/LogoBand'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { EMPTY_WALL, LOGO_WALLS, TRACK_RECORD_INTRO } from '../content/trackRecord'
import styles from './TrackRecord.module.css'

/**
 * The logo wall, one ruled row per kind. Only real, verified logos (see content/trackRecord.ts),
 * so most rows start empty and say so in a line rather than drawing fake slots.
 */
export function TrackRecord() {
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div ref={revealRef} className={`${ui.page} ${motion.reveal}`}>
      <PageIntro intro={TRACK_RECORD_INTRO} />
      <LogoBand showLink={false} />

      <div className={styles.walls}>
        {LOGO_WALLS.map((wall, index) => (
          <section key={wall.id} className={styles.wall} aria-labelledby={`wall-${index}`} data-reveal>
            <div className={styles.head}>
              <h2 id={`wall-${index}`} className={styles.title}>
                {wall.title}
              </h2>
              <p className={styles.text}>
                {wall.text}
              </p>
            </div>

            {wall.logos.length > 0 ? (
              <ul className={styles.logos}>
                {wall.logos.map((logo) => {
                  const mark = logo.src ? (
                    <img src={logo.src} alt={logo.name} loading="lazy" />
                  ) : (
                    <span className={styles.wordmark}>
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
              <p className={styles.empty}>
                {EMPTY_WALL}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
