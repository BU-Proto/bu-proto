import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router'
import styles from '../admin.module.css'
import { useBar } from '../lib/bar'
import { pageTitle } from '../lib/format'
import { sectionFor } from '../nav'
import { ChevronRightIcon } from './icons'

interface PageHeaderProps {
  title: string
  /** Tab title, when it should differ from the heading (e.g. "Edit event"). */
  tabTitle?: string
  /** The parent page, linked before the title as the way back. */
  back?: { to: string; label: string }
  /** A short figure after the title, in lighter type ("6 people"). */
  count?: ReactNode
  /** What the page is for, at the top of its content. */
  lede?: ReactNode
  /** The page's buttons, main one last. They ride in the bar, so they stay in reach while it scrolls. */
  actions?: ReactNode
}

/**
 * The top of every portal page. The heading, the way back and the buttons go into the shell's
 * sticky bar (through a portal, so the page still owns them); a section's own pages show as tabs
 * under the heading; the lede stays in the page.
 */
export function PageHeader({ title, tabTitle, back, count, lede, actions }: PageHeaderProps) {
  const bar = useBar()
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '')
  // Tabs only on the section's own pages (its list, its import), not on a row's editor.
  const tabs = sectionFor(path)?.tabs
  const showTabs = tabs?.some((tab) => tab.to === path)

  return (
    <>
      <title>{pageTitle(tabTitle ?? title)}</title>
      {bar &&
        createPortal(
          <>
            <div className={styles.bar}>
              <div className={styles.trail}>
                {back && (
                  <>
                    <Link className={styles.crumb} to={back.to}>
                      {back.label}
                    </Link>
                    <ChevronRightIcon className={styles.crumbSep} />
                  </>
                )}
                <h1 className={styles.title}>{title}</h1>
                {count !== undefined && count !== null && count !== false && <span className={styles.titleCount}>{count}</span>}
              </div>
              {actions && <div className={styles.actions}>{actions}</div>}
            </div>
            {showTabs && tabs && (
              <nav className={styles.sectionTabs} aria-label={`${title} pages`}>
                {tabs.map((tab) => (
                  <NavLink key={tab.to} to={tab.to} end className={styles.sectionTab}>
                    {tab.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </>,
          bar,
        )}
      {lede && <div className={styles.lede}>{lede}</div>}
    </>
  )
}
