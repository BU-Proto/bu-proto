import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PERSON_KIND_LABELS, type ContactKind, type PersonSummary } from '../../../shared/crm'
import ui from '../admin.module.css'
import { Kbd } from '../components/Kbd'
import { ChevronRightIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useSlashFocus } from '../lib/keys'
import { useSession } from '../lib/session'
import styles from './crm/crm.module.css'
import { formatAt, initials, isoOf, KIND_TONE } from './crm/format'
import { NewPerson } from './crm/NewPerson'
import { Due } from './crm/panels'
import { OwnerAvatar } from './crm/pickers'
import { useApi, useDebounced } from './people/useApi'
import { SegmentGroup } from '../components/SegmentGroup'

// People: members (signed up on the site) and contacts (everyone else) as one list. A contact
// with a member's email is the same person and only shows as the member.

type Tab = 'all' | 'member' | 'lead' | 'contact' | 'mine'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'member', label: 'Members' },
  { id: 'lead', label: 'Leads' },
  { id: 'contact', label: 'Contacts' },
  { id: 'mine', label: 'Mine' },
]

/** ?kind= from a link (alum is filed under Contacts, which holds everyone outside BU's students). */
function tabOf(kind: string | null): Tab {
  if (kind === 'alum') return 'contact'
  return TABS.some((tab) => tab.id === kind) ? (kind as Tab) : 'all'
}

const CONTACT_KINDS_FOR_NEW = new Set<string>(['contact', 'lead', 'alum'])

export function Component() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { me } = useSession()
  const q = params.get('q') ?? ''
  const tab = tabOf(params.get('kind'))
  const creating = params.get('new') === '1'
  const kindParam = params.get('kind')
  const newKind = (CONTACT_KINDS_FOR_NEW.has(kindParam ?? '') ? kindParam : 'contact') as ContactKind

  // The box is local so typing stays quick; the URL (and the fetch) follow once typing pauses.
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
  // Back and forward change q under the box; follow them.
  useEffect(() => {
    if (q !== pushed.current) {
      pushed.current = q
      setQuery(q)
    }
  }, [q])

  // One fetch for every tab, so each tab's count is right for the search.
  const { data, error, loading } = useApi<{ items: PersonSummary[] }>(`/admin/people${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  const everyone = data?.items ?? []
  const myEmail = me.email.toLowerCase()
  const inTab = (person: PersonSummary, id: Tab) =>
    id === 'all'
      ? true
      : id === 'mine'
        ? person.ownerEmail?.toLowerCase() === myEmail
        : id === 'contact'
          ? person.kind === 'contact' || person.kind === 'alum'
          : person.kind === id
  const shown = everyone.filter((person) => inTab(person, tab))

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
        title="People"
        count={data ? shown.length : undefined}
        actions={
          <button type="button" className={ui.primary} onClick={() => setParam('new', '1')}>
            <PlusIcon /> New person
          </button>
        }
      />

      <div className={ui.toolbar}>
        <SegmentGroup className={styles.toolbarTabs} label="Show">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={ui.tab}
              aria-pressed={entry.id === tab}
              onClick={() => setParam('kind', entry.id === 'all' ? null : entry.id, true)}
            >
              {entry.label}
              {data && <span className={ui.count}>{everyone.filter((person) => inTab(person, entry.id)).length}</span>}
            </button>
          ))}
        </SegmentGroup>
        <label className={`${ui.search} ${styles.search}`} role="search">
          <span className={ui.srOnly}>Search people</span>
          <SearchIcon />
          <input
            ref={searchBox}
            type="search"
            className={ui.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && query && setQuery('')}
            placeholder="Name, email, org or title"
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd>/</Kbd>
        </label>
      </div>

      {tab === 'contact' && <p className={ui.hint}>Contacts moved here from Email. Claude still reads their notes when it drafts an ask.</p>}

      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <div className={ui.panelFlush} aria-busy={loading || undefined}>
        {data && shown.length === 0 ? (
          <div className={ui.empty}>
            <h2>{q ? 'Nobody matches that' : tab === 'mine' ? 'Nobody is yours yet' : 'Nobody here yet'}</h2>
            {q ? (
              <button type="button" className={ui.button} onClick={() => setQuery('')}>
                Clear search
              </button>
            ) : tab === 'mine' ? (
              <p>Set yourself as the owner on someone’s page and they show up here.</p>
            ) : (
              <p>Members show up when they sign up on the site. Add anyone else with New person.</p>
            )}
          </div>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Kind</th>
                <th scope="col">Org or year</th>
                <th scope="col">Last touch</th>
                <th scope="col">Next step</th>
                <th scope="col">Owner</th>
                <th scope="col" className={ui.rowGo}>
                  <span className={ui.srOnly}>Open</span>
                </th>
              </tr>
            </thead>
            {!data ? (
              <tbody aria-hidden="true">
                {Array.from({ length: 6 }, (_, row) => (
                  <tr key={row}>
                    {[170, 70, 130, 100, 140, 26].map((width, cell) => (
                      <td key={cell}>
                        <span className={ui.skeleton} style={{ width: width - (row % 3) * 12 }} />
                      </td>
                    ))}
                    <td />
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody className={loading ? styles.stale : undefined}>
                {shown.map((person) => (
                  <tr key={person.key}>
                    <td>
                      <span className={ui.person}>
                        <span className={ui.avatar} aria-hidden="true">
                          {initials(person.name)}
                        </span>
                        <span className={styles.cellText}>
                          <Link to={`/admin/people/${person.key}`} className={ui.rowTitle}>
                            {person.name}
                          </Link>
                          <span className={styles.sub}>{person.email}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label="Kind">
                      <span className={ui.state} data-tone={KIND_TONE[person.kind]}>
                        {PERSON_KIND_LABELS[person.kind]}
                      </span>
                    </td>
                    <td data-label="Org or year">
                      {person.orgName ? (
                        <span className={styles.cellText}>
                          <span>{person.orgName}</span>
                          {person.title && <span className={styles.sub}>{person.title}</span>}
                        </span>
                      ) : (
                        <span className={styles.soft}>{person.type === 'member' ? [person.year, person.track].filter(Boolean).join(' · ') : person.title}</span>
                      )}
                    </td>
                    <td data-label="Last touch" className={`${styles.small} ${styles.soft}`}>
                      {person.lastTouch && (
                        <span className={ui.figure}>
                          {person.lastTouch.label} · <time dateTime={isoOf(person.lastTouch.at)}>{formatAt(person.lastTouch.at)}</time>
                        </span>
                      )}
                    </td>
                    <td data-label="Next step" className={styles.small}>
                      {person.nextFollowUp ? (
                        <span>
                          {person.nextFollowUp.title} · <Due dueOn={person.nextFollowUp.dueOn} />
                        </span>
                      ) : (
                        <span className={ui.dim}>None</span>
                      )}
                    </td>
                    <td data-label="Owner">
                      <OwnerAvatar email={person.ownerEmail} />
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

      <NewPerson
        open={creating}
        initialKind={newKind}
        onClose={() => setParam('new', null, true)}
        onCreated={(person) => navigate(`/admin/people/${person.key}`, { replace: true })}
      />
    </div>
  )
}
