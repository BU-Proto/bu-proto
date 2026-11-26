import { FILM_SECTION, HOME_FILM } from '../content/home'
import { Film } from './Film'
import styles from './FilmSection.module.css'

/**
 * The Boston film in its own section, after the map: a title, a line on what it shows, the film,
 * and its small print. Nothing renders without a film.
 */
export function FilmSection() {
  if (!HOME_FILM) return null
  return (
    <section className={styles.section} aria-labelledby="film">
      <header className={styles.head}>
        <h2 id="film" className={styles.title} data-reveal="rise">
          {FILM_SECTION.title}
        </h2>
        <p className={styles.lede} data-reveal="rise">
          {FILM_SECTION.lede}
        </p>
      </header>
      <Film film={HOME_FILM} />
      {HOME_FILM.note && <p className={styles.note}>{HOME_FILM.note}</p>}
    </section>
  )
}
