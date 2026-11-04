import { Link, useLoaderData, useSearchParams } from 'react-router'
import admin from '../admin.module.css'
import { EmptyState, RowFlags } from '../components/bits'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { displayValue, specFor, type ContentRow } from '../lib/content'
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
  const [params] = useSearchParams()
  const active = FILTERS.find((filter) => filter.value === params.get('show')) ?? FILTERS[0]
  const rows = items.filter(active.test)
  const summaryFields = spec.summaryKeys.map((key) => ({ key, field: spec.fields.find((field) => field.key === key) }))
  const isEvents = resource === 'events'

  return (
    <div className={admin.page}>
      <PageHeader
        title={spec.label}
        lede="Drafts only show here. Sample rows are made-up content, and the site marks them as samples."
        actions={
          <>
            {resource === 'hackathons' && (
              <Link className={admin.button} to="/admin/hackathons/import">
                Import from MLH &amp; Devpost
              </Link>
            )}
            <Link className={admin.primary} to={`/admin/${resource}/new`}>
              <PlusIcon /> New {spec.singular.toLowerCase()}
            </Link>
          </>
        }
      />

      <nav className={admin.tabs} aria-label={`Filter ${spec.label.toLowerCase()}`}>
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            className={admin.tab}
            to={filter.value === 'all' ? '.' : `?show=${filter.value}`}
            replace
            aria-current={filter === active ? 'page' : undefined}
          >
            {filter.label}
            <span className={admin.count}>{items.filter(filter.test).length}</span>
          </Link>
        ))}
      </nav>

      <div className={admin.panelFlush}>
        {rows.length === 0 ? (
          <EmptyState title={items.length === 0 ? `No ${spec.label.toLowerCase()} yet` : `Nothing under “${active.label}”`}>
            {items.length === 0 ? (
              <p>
                <Link className={admin.link} to={`/admin/${resource}/new`}>
                  Add the first {spec.singular.toLowerCase()}
                </Link>
              </p>
            ) : (
              <p>
                <Link className={admin.link} to="." replace>
                  Show all {spec.label.toLowerCase()}
                </Link>
              </p>
            )}
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
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      className={row.published ? admin.rowTitle : `${admin.rowTitle} ${admin.isDraft}`}
                      to={`/admin/${resource}/${row.id}`}
                    >
                      {displayValue(undefined, row[spec.titleKey])}
                    </Link>
                    <RowFlags placeholder={row.placeholder} published={row.published} />
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
                    <td className={admin.num} data-label="RSVPs">
                      {row.rsvpCount ?? 0}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
