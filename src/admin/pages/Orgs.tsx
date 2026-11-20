import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ORG_KIND_LABELS, type Org, type OrgKind } from '../../../shared/crm'
import ui from '../admin.module.css'
import { Kbd } from '../components/Kbd'
import { ChevronRightIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useSlashFocus } from '../lib/keys'
import styles from './crm/crm.module.css'
import { formatAt, isoOf, WALL_LABELS } from './crm/format'
import { NewOrg } from './crm/NewOrg'
import { OwnerAvatar } from './crm/pickers'
import { useApi, useDebounced } from './people/useApi'

// Orgs: the funds, companies, BU offices and hackathon organizers we work with.

type Tab = 'all' | OrgKind

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'vc', label: 'VCs' },
  { id: 'company', label: 'Companies' },
  { id: 'campus', label: 'Campus' },
  { id: 'hackathon', label: 'Hackathon organizers' },
  { id: 'other', label: 'Other' },
]

export function Component() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const kind = params.get('kind')
  const tab: Tab = TABS.some((entry) => entry.id === kind) ? (kind as Tab) : 'all'
  const creating = params.get('new') === '1'

  const [query, setQuery] = useState(q)
  const searchBox = useRef<HTMLInputElement>(null)
  useSlashFocus(searchBox)
  const settled = useDebounced(query.trim(), 250)
  const pushed = useRef(settled)
  useEffect(() => {
    if (settled === pushed.current) return
    pushed.current = settled
    if (settled === q) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (settled) next.set('q', settled)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [settled, q, setParams])
  useEffect(() => {
    if (q !== pushed.current) {
      pushed.current = q
      setQuery(q)
    }
  }, [q])

  const { data, error, loading } = useApi<{ items: Org[] }>(`/admin/orgs${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  const all = data?.items ?? []
  const count = (id: Tab) => all.filter((org) => id === 'all' || org.kind === id).length
  const shown = all.filter((org) => tab === 'all' || org.kind === tab)
  // "Other" only when something is filed there, so the filter stays short.
  const tabs = TABS.filter((entry) => entry.id !== 'other' || count('other') > 0 || tab === 'other')

  const setParam = (key: string, value: string | null, replace = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace },
    )

  return (
    <div className={ui.page}>
      <PageHeader
        title="Orgs"
        count={data ? shown.length : undefined}
        actions={
          <button type="button" className={ui.primary} onClick={() => setParam('new', '1')}>
            <PlusIcon /> New org
          </button>
        }
      />

      <div className={ui.toolbar}>
        <div className={`${ui.tabs} ${styles.toolbarTabs}`} role="group" aria-label="Show">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={ui.tab}
              aria-pressed={entry.id === tab}
              onClick={() => setParam('kind', entry.id === 'all' ? null : entry.id, true)}
            >
              {entry.label}
              {data && <span className={ui.count}>{count(entry.id)}</span>}
            </button>
          ))}
        </div>
        <label className={`${ui.search} ${styles.search}`} role="search">
          <span className={ui.srOnly}>Search orgs</span>
          <SearchIcon />
          <input
            ref={searchBox}
            type="search"
            className={ui.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && query && setQuery('')}
            placeholder="Name, site or focus"
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd>/</Kbd>
        </label>
      </div>

      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <div className={ui.panelFlush} aria-busy={loading || undefined}>
        {data && shown.length === 0 ? (
          <div className={ui.empty}>
            <h2>{q ? 'No orgs match that' : 'No orgs here yet'}</h2>
            {q ? (
              <button type="button" className={ui.button} onClick={() => setQuery('')}>
                Clear search
              </button>
            ) : (
              <p>Add the funds, companies and offices we work with, then their people.</p>
            )}
          </div>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col">Org</th>
                <th scope="col">Kind</th>
                <th scope="col">Focus</th>
                <th scope="col" className={ui.num}>
                  Contacts
                </th>
                <th scope="col" className={ui.num}>
                  Open deals
                </th>
                <th scope="col">Last touch</th>
                <th scope="col">Logo wall</th>
                <th scope="col">Owner</th>
                <th scope="col" className={ui.rowGo}>
                  <span className={ui.srOnly}>Open</span>
                </th>
              </tr>
            </thead>
            {!data ? (
              <tbody aria-hidden="true">
                {Array.from({ length: 5 }, (_, row) => (
                  <tr key={row}>
                    {[160, 70, 150, 24, 24, 100, 60, 26].map((width, cell) => (
                      <td key={cell}>
                        <span className={ui.skeleton} style={{ width: width - (row % 3) * 8 }} />
                      </td>
                    ))}
                    <td />
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody className={loading ? styles.stale : undefined}>
                {shown.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <span className={styles.cellText}>
                        <Link to={`/admin/orgs/${org.id}`} className={ui.rowTitle}>
                          {org.name}
                        </Link>
                        {org.website && <span className={styles.sub}>{org.website.replace(/^https?:\/\//, '')}</span>}
                      </span>
                    </td>
                    <td data-label="Kind" className={styles.soft}>
                      {ORG_KIND_LABELS[org.kind]}
                    </td>
                    <td data-label="Focus" className={`${styles.small} ${styles.soft}`}>
                      {org.focus}
                    </td>
                    <td data-label="Contacts" className={ui.num}>
                      {org.contactCount}
                    </td>
                    <td data-label="Open deals" className={ui.num}>
                      {org.openDealCount}
                    </td>
                    <td data-label="Last touch" className={`${styles.small} ${styles.soft}`}>
                      {org.lastTouch && (
                        <span className={ui.figure}>
                          {org.lastTouch.label} · <time dateTime={isoOf(org.lastTouch.at)}>{formatAt(org.lastTouch.at)}</time>
                        </span>
                      )}
                    </td>
                    <td data-label="Logo wall">
                      {org.wall ? (
                        <span className={ui.state} data-tone="live">
                          {WALL_LABELS[org.wall]}
                        </span>
                      ) : (
                        <span className={ui.dim}>None</span>
                      )}
                    </td>
                    <td data-label="Owner">
                      <OwnerAvatar email={org.ownerEmail} />
                    </td>
                    <td className={ui.rowGo} aria-hidden="true">
                      <ChevronRightIcon />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}
      </div>

      <NewOrg
        open={creating}
        initialKind={tab === 'all' ? 'company' : tab}
        onClose={() => setParam('new', null, true)}
        onCreated={(org) => navigate(`/admin/orgs/${org.id}`, { replace: true })}
      />
    </div>
  )
}
