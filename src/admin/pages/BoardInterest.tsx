import { useState } from 'react'
import type { BoardInterest } from '../../../shared/api'
import { BOARD_SEATS } from '../../../shared/constants'
import { api } from '../../lib/api'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatStampDate, plural, stampToIso } from './people/format'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import styles from './Fund.module.css'

/** Everyone who put their hand up for a board seat on the board page, newest first. */
export function Component() {
  const { data, error, loading, setData } = useApi<{ items: BoardInterest[] }>('/admin/board-interest')
  const all = data?.items ?? []
  const [deleting, setDeleting] = useState<BoardInterest | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [announcement, setAnnouncement] = useState('')

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await api(`/admin/board-interest/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      setAnnouncement(`Deleted ${deleting.name}’s entry.`)
      setDeleting(null)
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={shared.page}>
      <title>Board interest · Admin · BU Proto</title>

      <header className={shared.head}>
        <div className={shared.headText}>
          <h1 className={shared.title}>
            Board interest
            {data && <span className={shared.count}>{plural(all.length, 'person', 'people')}</span>}
          </h1>
          <p className={shared.lede}>
            Who put their hand up on the board page, and for which seat. They got a confirmation email; the owners get a
            note for each one.
          </p>
        </div>
      </header>

      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {data && all.length > 0 && (
        <p className={shared.dim}>
          {BOARD_SEATS.map((seat) => `${seat}: ${all.filter((entry) => entry.role === seat).length}`).join(', ')}
        </p>
      )}
      <p className={styles.live} aria-live="polite">
        {announcement}
      </p>

      {!data && loading ? (
        <p className={shared.empty}>Loading…</p>
      ) : data && all.length === 0 ? (
        <p className={`${shared.panel} ${shared.empty}`}>No one has put their hand up yet.</p>
      ) : (
        <ul className={styles.entries}>
          {all.map((entry) => (
            <li key={entry.id} className={`${shared.panel} ${styles.entry}`}>
              <div className={styles.entryHead}>
                <div className={styles.who}>
                  <h2 className={styles.name}>{entry.name}</h2>
                  <a href={`mailto:${entry.email}`} className={`${shared.link} ${shared.mono} ${styles.email}`}>
                    {entry.email}
                  </a>
                  <span className={shared.dim}>{entry.year}</span>
                </div>
                <div className={styles.facts}>
                  <span className={styles.amount}>{entry.role}</span>
                  <time className={`${shared.figure} ${shared.dim}`} dateTime={stampToIso(entry.createdAt)}>
                    {formatStampDate(entry.createdAt)}
                  </time>
                </div>
              </div>
              {entry.note && (
                <dl className={styles.answers}>
                  <div>
                    <dt className={shared.label}>What they’d take on</dt>
                    <dd className={styles.spend}>{entry.note}</dd>
                  </div>
                </dl>
              )}
              <div>
                <button type="button" className={shared.small} onClick={() => setDeleting(entry)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Delete ${deleting.name}’s entry?` : 'Delete entry?'}
        confirmLabel="Delete entry"
        danger
        busy={busy}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setDeleting(null)
          setDeleteError('')
        }}
      >
        <p>It comes off the list. It can’t be undone.</p>
      </ConfirmDialog>
    </div>
  )
}
