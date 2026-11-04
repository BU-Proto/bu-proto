import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from '../admin.module.css'
import { pageTitle } from '../lib/format'

interface PageHeaderProps {
  title: string
  /** Tab title, when it should differ from the heading (e.g. "Edit event"). */
  tabTitle?: string
  /** A parent page, shown above the title as a mono breadcrumb. */
  back?: { to: string; label: string }
  /** A section name above the title, when there's no parent page to go back to. */
  eyebrow?: string
  lede?: ReactNode
  actions?: ReactNode
}

/** The top of every portal page: tab title, breadcrumb, heading, and the page's main buttons. */
export function PageHeader({ title, tabTitle, back, eyebrow, lede, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <title>{pageTitle(tabTitle ?? title)}</title>
      <div className={styles.headerText}>
        {back ? (
          <p className={styles.eyebrow}>
            <Link to={back.to}>← {back.label}</Link>
          </p>
        ) : (
          eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>
        )}
        <h1 className={styles.title}>{title}</h1>
        {lede && <p className={styles.lede}>{lede}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
