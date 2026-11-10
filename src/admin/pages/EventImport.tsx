import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { EVENT_IMPORT_BLOCKED, type EventImportPreview, type EventImportSource, type ProtoEvent } from '../../../shared/api'
import { ApiError, api } from '../../lib/api'
import admin from '../admin.module.css'
import { StatusLine, type StatusTone } from '../components/bits'
import { PageHeader } from '../components/PageHeader'
import styles from './EventImport.module.css'

// One event page to an event draft. Look up shows what the draft would be; importing makes it
// unpublished and opens its editor. The Worker reads the page again for the import. When the site
// turns the Worker away (Luma rate-limits Cloudflare's shared addresses), the admin pastes the
// page's source from their own browser instead, and both steps read that.

const SOURCE_NAMES: Record<EventImportSource, string> = {
  luma: 'Luma',
  eventbrite: 'Eventbrite',
  other: 'Other (schema.org event data)',
}

const dayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const formatDay = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`))

/** A field's own message (a bad link) beats the generic "check the fields". */
const message = (error: unknown) =>
  error instanceof ApiError ? (error.issues.url ?? error.message) : error instanceof Error ? error.message : 'Something went wrong.'

export function Component() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<EventImportPreview | null>(null)
  const [busy, setBusy] = useState<'lookup' | 'import' | null>(null)
  const [notice, setNotice] = useState<{ tone: StatusTone; text: string } | null>(null)
  // Set once the site turned us away: then the page's source comes from the admin's browser.
  const [blocked, setBlocked] = useState(false)
  const [source, setSource] = useState('')
  const pasted = blocked && source.trim() ? source : undefined

  const lookUp = async (event: FormEvent) => {
    event.preventDefault()
    const link = url.trim()
    if (!link) return setNotice({ tone: 'error', text: 'Paste an event link.' })
    if (blocked && !pasted) return setNotice({ tone: 'error', text: 'Paste the page’s source first.' })
    setBusy('lookup')
    setPreview(null)
    setNotice({ tone: 'info', text: pasted ? 'Reading the pasted page…' : 'Reading the event page…' })
    try {
      const data = await api<EventImportPreview>('/admin/event-import/lookup', { body: { url: link, html: pasted } })
      setPreview(data)
      setNotice(null)
    } catch (error) {
      if (error instanceof ApiError && error.issues[EVENT_IMPORT_BLOCKED]) {
        setBlocked(true)
        setNotice({ tone: 'error', text: 'That site turned our server away. Paste the page below instead.' })
      } else {
        setNotice({ tone: 'error', text: message(error) })
      }
    } finally {
      setBusy(null)
    }
  }

  const importDraft = async () => {
    if (!preview) return
    setBusy('import')
    setNotice({ tone: 'info', text: 'Making the draft…' })
    try {
      const { item } = await api<{ item: ProtoEvent }>('/admin/event-import/import', {
        body: { url: pasted ? url.trim() : preview.url, html: pasted },
      })
      navigate(`/admin/events/${item.id}`)
    } catch (error) {
      setNotice({ tone: 'error', text: message(error) })
      setBusy(null)
    }
  }

  const event = preview?.event

  return (
    <div className={admin.page}>
      <PageHeader
        title="Events"
        tabTitle="Import an event"
        lede={
          <>
            <p>
              Paste a Luma or Eventbrite event link. Other pages work too if they carry schema.org event data, as Meetup and
              most university calendars do.
            </p>
            <p className={admin.dim}>
              Drafts stay unpublished until someone reviews them. The cover is linked from the source site, not copied here.
            </p>
          </>
        }
      />

      <form className={`${admin.panel} ${styles.form}`} onSubmit={lookUp}>
        <label className={admin.field}>
          <span className={admin.label}>Event link</span>
          <input
            className={admin.input}
            type="url"
            inputMode="url"
            value={url}
            onChange={(change) => {
              setUrl(change.target.value)
              // A new link starts over: it may not be blocked, and old pasted source isn't its page.
              setBlocked(false)
              setSource('')
            }}
            placeholder="https://lu.ma/… or https://www.eventbrite.com/e/…"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        {blocked && (
          <div className={styles.paste}>
            <p className={styles.pasteLead}>
              The site won’t let our server read it, but your browser can. Copy the page’s source and paste it here:
            </p>
            <ol className={styles.steps}>
              <li>
                Open{' '}
                <a className={admin.link} href={url.trim()} target="_blank" rel="noreferrer">
                  the event page
                </a>
                .
              </li>
              <li>View its source: Ctrl+U, or Cmd+Option+U on a Mac.</li>
              <li>Select everything (Ctrl+A or Cmd+A), copy it, and paste it below.</li>
            </ol>
            <label className={admin.field}>
              <span className={admin.label}>Page source</span>
              <textarea
                className={`${admin.input} ${styles.source}`}
                value={source}
                onChange={(change) => setSource(change.target.value)}
                rows={5}
                spellCheck={false}
                placeholder="<!DOCTYPE html>…"
              />
            </label>
          </div>
        )}
        <div className={styles.row}>
          <button type="submit" className={admin.primary} disabled={busy !== null || !url.trim() || (blocked && !pasted)}>
            {busy === 'lookup' ? 'Looking up…' : blocked ? 'Read the pasted page' : 'Look up'}
          </button>
          <StatusLine tone={notice?.tone}>{notice?.text}</StatusLine>
        </div>
      </form>

      {preview && event && (
        <section className={`${admin.panel} ${styles.preview}`} aria-label="What the draft will be">
          {event.photo ? (
            <img className={styles.cover} src={event.photo} alt="" />
          ) : (
            <span className={styles.cover} aria-hidden="true" />
          )}
          <div className={styles.details}>
            <h2 className={styles.title}>
              <a className={admin.link} href={preview.url} target="_blank" rel="noreferrer">
                {event.title}
                <span className={admin.srOnly}> (opens the source page)</span>
              </a>
            </h2>
            <dl className={styles.facts}>
              <dt>When</dt>
              <dd>
                {formatDay(event.date)}, {event.time}
              </dd>
              <dt>Where</dt>
              <dd>{event.place}</dd>
              <dt>Kind</dt>
              <dd>
                {event.kind} <span className={admin.dim}>(a guess; change it in the editor)</span>
              </dd>
              <dt>Hosts</dt>
              <dd>{event.hosts.map((host) => host.name).join(', ') || '—'}</dd>
              <dt>Source</dt>
              <dd>{SOURCE_NAMES[preview.source]}</dd>
            </dl>
            {event.text && <p className={styles.text}>{event.text}</p>}
            <div className={styles.row}>
              {preview.existingEventId !== null ? (
                <p className={styles.existing}>
                  Already added:{' '}
                  <Link className={admin.link} to={`/admin/events/${preview.existingEventId}`}>
                    open that event
                  </Link>
                </p>
              ) : (
                <button type="button" className={admin.primary} onClick={importDraft} disabled={busy !== null}>
                  {busy === 'import' ? 'Importing…' : 'Import as draft'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
