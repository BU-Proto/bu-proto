import { Link, useLocation, useRouteError } from 'react-router'
import { BRAND, ROUTE_STATES } from '../content/site'
import ui from './ui.module.css'
import styles from './RouteStates.module.css'

/** A page's HydrateFallback: Layout and the field are already up, so just a quiet line. */
export function PageLoading() {
  return (
    <div className={ui.page}>
      <p className={styles.loading} role="status" data-fog-clear>
        {ROUTE_STATES.loading}
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
