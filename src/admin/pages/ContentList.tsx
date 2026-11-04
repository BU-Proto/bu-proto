import { Link, useLoaderData, useSearchParams } from 'react-router'
import admin from '../admin.module.css'
import { EmptyState, RowBadges } from '../components/bits'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { displayValue, specFor, type ContentRow } from '../lib/content'
import type { contentListLoader } from '../loaders'

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
        eyebrow="Site content"
        lede={`${items.length} in all. Unpublished rows only show here; sample rows carry the “sample” tag on the site.`}
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
                  <th key={key} scope="col">
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
                    <Link className={admin.rowTitle} to={`/admin/${resource}/${row.id}`}>
                      {displayValue(undefined, row[spec.titleKey])}
                    </Link>
                    <RowBadges placeholder={row.placeholder} published={row.published} />
                  </td>
                  {summaryFields.map(({ key, field }) => (
                    <td
                      key={key}
                      data-label={field?.label ?? key}
                      className={field?.type === 'date' || field?.type === 'number' ? admin.mono : admin.soft}
                    >
                      {displayValue(field, row[key])}
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
