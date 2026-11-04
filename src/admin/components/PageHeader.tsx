import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from '../admin.module.css'
import { pageTitle } from '../lib/format'

interface PageHeaderProps {
  title: string
  /** Tab title, when it should differ from the heading (e.g. "Edit event"). */
  tabTitle?: string
  /** A parent page, linked above the title. Section names aren't repeated here: the sidebar has them. */
  back?: { to: string; label: string }
  /** A short figure after the title, in lighter type ("6 people"). */
  count?: ReactNode
  lede?: ReactNode
  actions?: ReactNode
}

/** The top of every portal page: tab title, way back, heading, and the page's main buttons. */
export function PageHeader({ title, tabTitle, back, count, lede, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <title>{pageTitle(tabTitle ?? title)}</title>
      <div className={styles.headerText}>
        {back && (
          <p className={styles.back}>
            <Link to={back.to}>← {back.label}</Link>
          </p>
        )}
        <h1 className={styles.title}>
          {title}
          {count !== undefined && <span className={styles.titleCount}> {count}</span>}
        </h1>
        {lede && <div className={styles.lede}>{lede}</div>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
