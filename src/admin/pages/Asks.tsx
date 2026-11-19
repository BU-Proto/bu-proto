import { Link, useSearchParams } from 'react-router'
import type { Ask, AskSetup, AskStatus } from '../../../shared/api'
import { ASK_STATUSES } from '../../../shared/constants'
import ui from '../admin.module.css'
import { ChevronRightIcon, PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { ASK_STATUS_LABELS } from '../lib/asks'
import { formatRelative } from '../lib/format'
import { formatIsoDay } from './people/format'
import shared from './people/people.module.css'
import { useApi } from './people/useApi'
import styles from './Asks.module.css'

const TONES: Record<AskStatus, string | undefined> = { draft: 'draft', waiting: 'sample', answered: 'live', closed: undefined }

const isStatus = (value: string | null): value is AskStatus => (ASK_STATUSES as readonly string[]).includes(value ?? '')

/** Where an ask stands, in a few words: a waiting one says when it'll be followed up. */
function askState(ask: Ask): string {
  if (ask.status === 'draft') return ask.body ? 'Draft ready' : 'Not drafted'
  if (ask.status === 'waiting') {
    if (ask.body) return 'Follow-up ready'
    return ask.followUpDue ? `Waiting · follow up ${formatIsoDay(ask.followUpDue)}` : 'Waiting'
  }
  return ASK_STATUS_LABELS[ask.status]
}

export function AskState({ ask }: { ask: Ask }) {
  return (
    <span className={ui.state} data-tone={TONES[ask.status]}>
      {askState(ask)}
    </span>
  )
}

/** Shown when a key is missing: without Claude's there are no drafts, without Resend's nothing leaves. */
export function SetupNote({ setup }: { setup: AskSetup | undefined }) {
  if (!setup || (setup.claude && setup.resend)) return null
  return (
    <div className={styles.setup}>
      {!setup.claude && (
        <p>
          <strong>Claude isn’t set up here.</strong> An owner adds the <code>ANTHROPIC_API_KEY</code> secret. Until then, drafts on a local
          copy are stand-ins (your request as typed), and the live site can’t draft.
        </p>
      )}
      {!setup.resend && (
        <p>
          <strong>Email isn’t set up here.</strong> Without <code>RESEND_API_KEY</code>, Send only logs the email; nothing leaves.
        </p>
      )}
    </div>
  )
}

/** Every ask, newest activity first, with where each one stands. */
export function Component() {
  const [params] = useSearchParams()
  const rawStatus = params.get('status')
  const status = isStatus(rawStatus) ? rawStatus : null
  const { data, error, loading } = useApi<{ items: Ask[]; setup: AskSetup }>('/admin/asks')
  const all = data?.items ?? []
  const shown = status ? all.filter((ask) => ask.status === status) : all.filter((ask) => ask.status !== 'closed')
  // Something for a teammate to do: a draft to check, or a follow-up Claude wrote.
  const ready = all.filter((ask) => ask.body && (ask.status === 'draft' || ask.status === 'waiting')).length

  return (
    <div className={shared.page}>
      <PageHeader
        title="Email"
        tabTitle="Asks"
        count={ready ? `${ready} to check` : undefined}
        lede="Emails to people we need something from: a room, a form, an answer. Say what you need; Claude writes the email and fills in any forms; you check it and press Send. Replies go to whoever made the ask."
        actions={
          <Link to="/admin/email/asks/new" className={ui.primary}>
            <PlusIcon /> New ask
          </Link>
        }
      />
      <SetupNote setup={data?.setup} />
      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {data && all.length > 0 && (
        <nav aria-label="Filter by status">
          <ul className={shared.tabs}>
            <li>
              <Link to={{ search: '' }} replace className={shared.tab} aria-current={status === null ? 'page' : undefined}>
                Open <span className={shared.tabCount}>{all.filter((ask) => ask.status !== 'closed').length}</span>
              </Link>
            </li>
            {ASK_STATUSES.map((value) => (
              <li key={value}>
                <Link to={{ search: `?status=${value}` }} replace className={shared.tab} aria-current={status === value ? 'page' : undefined}>
                  {ASK_STATUS_LABELS[value]} <span className={shared.tabCount}>{all.filter((ask) => ask.status === value).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {!data && loading ? (
        <div className={shared.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 160, marginBottom: 14 }} />
          <span className={ui.skeleton} style={{ width: 320 }} />
        </div>
      ) : data && all.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>Nothing asked yet</h2>
          <p>Need a room, a form back, a sponsor’s answer? Say it in a sentence and Claude drafts the email.</p>
          <Link to="/admin/email/asks/new" className={ui.button}>
            Make the first ask
          </Link>
        </div>
      ) : data && shown.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>Nothing here</h2>
          <Link to={{ search: '' }} replace className={ui.button}>
            Show open asks
          </Link>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>To</th>
                <th>What</th>
                <th>Status</th>
                <th>By</th>
                <th>Updated</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {shown.map((ask) => (
                <tr key={ask.id}>
                  <td>
                    <Link to={`/admin/email/asks/${ask.id}`} className={ui.rowTitle}>
                      {ask.toName}
                    </Link>
                    {ask.toOrganization && <div className={styles.whatLine}>{ask.toOrganization}</div>}
                  </td>
                  <td data-label="What">
                    <div className={styles.what}>
                      <span>{ask.subject || ask.request.split('\n')[0]}</span>
                      {ask.subject && <span className={styles.whatLine}>{ask.request.split('\n')[0]}</span>}
                    </div>
                  </td>
                  <td data-label="Status">
                    <AskState ask={ask} />
                  </td>
                  <td data-label="By" className={ui.dim}>
                    {ask.ownerName || ask.ownerEmail}
                  </td>
                  <td data-label="Updated" className={`${ui.dim} ${ui.nowrap}`}>
                    {formatRelative(ask.updatedAt)}
                  </td>
                  <td className={ui.rowGo} aria-hidden="true">
                    <ChevronRightIcon />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
