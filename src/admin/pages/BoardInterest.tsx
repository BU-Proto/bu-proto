import { useState } from 'react'
import type { BoardInterest } from '../../../shared/api'
import { BOARD_SEATS } from '../../../shared/constants'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatStampDate, stampToIso } from './people/format'
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
  const toast = useToast()

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await api(`/admin/board-interest/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      toast(`${deleting.name}’s entry deleted`)
      setDeleting(null)
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={shared.page}>
      <PageHeader
        title="Board"
        tabTitle="Board interest"
        lede="Who put their hand up on the board page, and for which seat. They got a confirmation email; the owners get a note for each one."
      />

      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {data && all.length > 0 && (
        <ul className={styles.seats} aria-label="People per seat">
          {BOARD_SEATS.map((seat) => (
            <li key={seat}>
              {seat} <span className={shared.figure}>{all.filter((entry) => entry.role === seat).length}</span>
            </li>
          ))}
        </ul>
      )}
      {!data && loading ? (
        <div className={shared.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 160, marginBottom: 14 }} />
          <span className={ui.skeleton} style={{ width: 320 }} />
        </div>
      ) : data && all.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>No one has put their hand up yet</h2>
          <p>People who fill in the form on the board page show up here.</p>
        </div>
      ) : (
        <ul className={styles.entries}>
          {all.map((entry) => (
            <li key={entry.id} className={`${shared.panel} ${styles.entry}`}>
              <div className={styles.entryHead}>
                <span className={ui.avatar} aria-hidden="true">
                  {entry.name.trim().slice(0, 1).toUpperCase()}
                </span>
                <div className={styles.who}>
                  <h2 className={styles.name}>{entry.name}</h2>
                  <p className={styles.meta}>
                    <a href={`mailto:${entry.email}`} className={shared.link}>
                      {entry.email}
                    </a>
                    <span>{entry.year}</span>
                    <time dateTime={stampToIso(entry.createdAt)}>Sent {formatStampDate(entry.createdAt)}</time>
                  </p>
                </div>
                <button type="button" className={`${ui.dangerGhost} ${styles.delete}`} aria-label={`Delete ${entry.name}’s entry`} onClick={() => setDeleting(entry)}>
                  <TrashIcon />
                </button>
              </div>
              <dl className={styles.answers}>
                <div>
                  <dt>Seat</dt>
                  <dd>{entry.role}</dd>
                </div>
                {entry.note && (
                  <div>
                    <dt>What they’d take on</dt>
                    <dd className={styles.spend}>{entry.note}</dd>
                  </div>
                )}
              </dl>
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
