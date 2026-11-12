import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { ApiError } from '../../lib/api'
import styles from '../admin.module.css'
import { isUnauthorized, messageFor, useSession } from '../lib/session'
import { PageHeader } from './PageHeader'

const statusOf = (error: unknown) =>
  isRouteErrorResponse(error) ? error.status : error instanceof ApiError ? error.status : undefined

/**
 * Errors from any portal page, shown inside the shell so the sidebar stays usable. A 401 means
 * the session ran out while signed in: hand back to the shell's sign-in screen.
 */
export function RouteError() {
  const error = useRouteError()
  const { expire } = useSession()
  const unauthorized = isUnauthorized(error)

  useEffect(() => {
    if (unauthorized) expire()
  }, [unauthorized, expire])

  if (unauthorized) return null

  if (statusOf(error) === 404) {
    return (
      <div className={styles.page}>
        <PageHeader title="Not found" lede="There’s nothing at this address. It may have been deleted, or the link is off." />
        <p>
          <Link className={styles.button} to="/admin">
            Back to the overview
          </Link>
        </p>
      </div>
    )
  }

  if (!(error instanceof ApiError) && !isRouteErrorResponse(error)) console.error(error)
  const message = isRouteErrorResponse(error) ? error.statusText || `Error ${error.status}` : messageFor(error)

  return (
    <div className={styles.page}>
      <PageHeader title="Something went wrong" />
      <div className={styles.callout} role="alert">
        <h2>This page couldn’t load.</h2>
        <p>{message}</p>
        <p className={styles.dim}>
          Try again, or go back to the overview.
          {statusOf(error) ? <span> (HTTP {statusOf(error)})</span> : null}
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={() => window.location.reload()}>
            Try again
          </button>
          <Link className={styles.ghost} to="/admin">
            Overview
          </Link>
        </div>
      </div>
    </div>
  )
}
