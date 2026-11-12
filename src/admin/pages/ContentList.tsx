import { useRef } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import admin from '../admin.module.css'
import { EmptyState, RowState } from '../components/bits'
import { Kbd } from '../components/Kbd'
import { ChevronRightIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { displayValue, specFor, type ContentRow } from '../lib/content'
import { useSlashFocus } from '../lib/keys'
import type { contentListLoader } from '../loaders'
import styles from './ContentList.module.css'

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** "2026-11-12" → "Nov 12, 2026". Anything else shows as it is. */
function formatDay(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return displayValue(undefined, value)
  return dayFormat.format(new Date(`${value}T00:00:00Z`))
}

const FILTERS = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'published', label: 'Published', test: (row: ContentRow) => row.published },
  { value: 'drafts', label: 'Drafts', test: (row: ContentRow) => !row.published },
  { value: 'samples', label: 'Samples', test: (row: ContentRow) => row.placeholder },
] as const

export function Component() {
  const { resource, items } = useLoaderData<typeof contentListLoader>()
  const spec = specFor(resource)
  const [params, setParams] = useSearchParams()
  const searchBox = useRef<HTMLInputElement>(null)
  useSlashFocus(searchBox)

  const active = FILTERS.find((filter) => filter.value === params.get('show')) ?? FILTERS[0]
  const query = params.get('q') ?? ''
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const summaryFields = spec.summaryKeys.map((key) => ({ key, field: spec.fields.find((field) => field.key === key) }))

  // Search reads the title and the columns on screen, so "panel" or "Brown" finds what you see.
  const matches = (row: ContentRow) => {
    if (words.length === 0) return true
    const text = [row[spec.titleKey], ...spec.summaryKeys.map((key) => row[key])].map((value) => displayValue(undefined, value)).join(' ').toLowerCase()
    return words.every((word) => text.includes(word))
  }
  const rows = items.filter(active.test).filter(matches)
  const isEvents = resource === 'events'
  const lower = spec.label.toLowerCase()

  // The filter and the search live in the URL, so Back and a shared link land on the same list.
  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  return (
    <div className={admin.page}>
      <PageHeader
        title={spec.label}
        count={items.length}
        actions={
          <Link className={admin.primary} to={`/admin/${resource}/new`}>
            <PlusIcon /> New {spec.singular.toLowerCase()}
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className={admin.panel}>
          <EmptyState title={`No ${lower} yet`}>
            <p>Anything added here shows on the site once it’s published.</p>
            <Link className={admin.primary} to={`/admin/${resource}/new`}>
              <PlusIcon /> New {spec.singular.toLowerCase()}
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className={admin.toolbar}>
            <nav className={admin.tabs} aria-label={`Filter ${lower}`}>
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={admin.tab}
                  aria-current={filter === active ? 'true' : undefined}
                  onClick={() => setParam('show', filter.value === 'all' ? '' : filter.value)}
                >
                  {filter.label}
                  <span className={admin.count}>{items.filter(filter.test).length}</span>
                </button>
              ))}
            </nav>
            <label className={admin.search}>
              <span className={admin.srOnly}>Search {lower}</span>
              <SearchIcon />
              <input
                ref={searchBox}
                type="search"
                className={admin.input}
                value={query}
                onChange={(event) => setParam('q', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Escape' || !query) return
                  setParam('q', '')
                }}
                placeholder={`Search ${lower}`}
                autoComplete="off"
                spellCheck={false}
              />
              <Kbd>/</Kbd>
            </label>
          </div>

          <div className={admin.panelFlush}>
            {rows.length === 0 ? (
              <EmptyState title={query ? `No ${lower} match “${query.trim()}”` : `Nothing under ${active.label}`}>
                <button type="button" className={admin.button} onClick={() => setParams({}, { replace: true })}>
                  {query && active.value !== 'all' ? 'Clear search and filter' : query ? 'Clear search' : `Show all ${lower}`}
                </button>
              </EmptyState>
            ) : (
              <table className={admin.table}>
                <thead>
                  <tr>
                    <th scope="col">{spec.fields.find((field) => field.key === spec.titleKey)?.label ?? 'Title'}</th>
                    {summaryFields.map(({ key, field }) => (
                      <th key={key} scope="col" className={field?.type === 'date' ? styles.dateCol : undefined}>
                        {field?.label ?? key}
                      </th>
                    ))}
                    {isEvents && (
                      <th scope="col" className={admin.num}>
                        RSVPs
                      </th>
                    )}
                    <th scope="col" className={styles.stateCol}>
                      Status
                    </th>
                    <th scope="col" className={admin.rowGo}>
                      <span className={admin.srOnly}>Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.titleCell}>
                        <Link className={row.published ? admin.rowTitle : `${admin.rowTitle} ${admin.isDraft}`} to={`/admin/${resource}/${row.id}`}>
                          {displayValue(undefined, row[spec.titleKey])}
                        </Link>
                      </td>
                      {summaryFields.map(({ key, field }) => (
                        <td
                          key={key}
                          data-label={field?.label ?? key}
                          className={field?.type === 'date' || field?.type === 'number' ? `${admin.soft} ${admin.figure}` : admin.soft}
                        >
                          {field?.type === 'date' ? formatDay(row[key]) : displayValue(field, row[key])}
                          {/* A win's prize track reads as part of its placement, so it sits under it. */}
                          {resource === 'wins' && key === 'placement' && typeof row.track === 'string' && row.track && (
                            <span className={styles.subline}>{row.track}</span>
                          )}
                        </td>
                      ))}
                      {isEvents && (
                        <td className={`${admin.num} ${row.rsvpCount ? '' : admin.dim}`} data-label="RSVPs">
                          {row.rsvpCount ?? 0}
                        </td>
                      )}
                      <td data-label="Status">
                        <RowState placeholder={row.placeholder} published={row.published} />
                      </td>
                      <td className={admin.rowGo} aria-hidden="true">
                        <ChevronRightIcon />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
