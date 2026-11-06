import { Link, useLocation, useRouteError } from 'react-router'
import { BRAND, ROUTE_STATES, sectionName } from '../content/site'
import ui from './ui.module.css'
import styles from './RouteStates.module.css'

/**
 * A page's HydrateFallback: Layout and the field are already up, so the page holds a screen's
 * height (Layout hides the footer meanwhile, so it doesn't jump up and back down) and shows the
 * trail's three glyphs pulsing where the page's title will land.
 */
export function PageLoading() {
  const { pathname } = useLocation()
  const section = sectionName(pathname)
  return (
    <div className={`${ui.page} ${styles.pending}`} data-route-loading>
      <title>{section ? `${section} · ${BRAND.full}` : BRAND.full}</title>
      <p className={styles.loading} role="status">
        <span className={styles.glyphs} aria-hidden="true">
          <span>○</span>
          <span>&gt;</span>
          <span>_</span>
        </span>
        <span className={ui.srOnly}>{ROUTE_STATES.loading}</span>
      </p>
    </div>
  )
}

/** A page's ErrorBoundary. It renders inside Layout, so the field and top bar stay put. */
export function LoadError() {
  const error = useRouteError()
  const location = useLocation()
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className={ui.page}>
      <title>{`${ROUTE_STATES.error.title} · ${BRAND.full}`}</title>
      <section className={`${ui.panel} ${styles.error}`} role="alert">
        <h1 className={styles.title} data-fog-clear>
          {ROUTE_STATES.error.title}
        </h1>
        <p className={styles.text} data-fog-clear>
          {ROUTE_STATES.error.text}
        </p>
        {/* Navigating to the same URL re-runs its loaders. */}
        <Link className={ui.secondary} to={`${location.pathname}${location.search}`} replace data-fog-clear="box">
          {ROUTE_STATES.error.retry}
        </Link>
      </section>
    </div>
  )
}
