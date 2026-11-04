import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useBlocker, useLoaderData, useLocation, useNavigate } from 'react-router'
import { api, ApiError } from '../../lib/api'
import admin from '../admin.module.css'
import { StatusLine, type StatusTone } from '../components/bits'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContentField } from '../components/ContentField'
import { ArrowOutIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { RsvpPanel } from '../components/RsvpPanel'
import { layoutFor, sectionsFor, sitePathFor, specFor, toForm, toPayload, type ContentRow, type FieldSection, type FormValues } from '../lib/content'
import { formatClock, formatTimestamp } from '../lib/format'
import { messageFor, useAuthGuard } from '../lib/session'
import type { contentEditorLoader } from '../loaders'
import styles from './ContentEditor.module.css'

// Wide fields take the whole row; short ones pair up on laptops.
const WIDE_TYPES = new Set(['textarea', 'list', 'links', 'people', 'images', 'image', 'boolean'])

export function Component() {
  const loaded = useLoaderData<typeof contentEditorLoader>()
  // A fresh editor per row, so moving between rows never carries a draft across.
  return <Editor key={`${loaded.resource}/${loaded.item?.id ?? 'new'}`} {...loaded} />
}

type Loaded = Awaited<ReturnType<typeof contentEditorLoader>>

function Editor({ resource, item, rsvps }: Loaded) {
  const spec = specFor(resource)
  const navigate = useNavigate()
  const location = useLocation()
  const guard = useAuthGuard()
  const formRef = useRef<HTMLFormElement>(null)
  // Set right before navigating away on purpose (after a create or delete), so the blocker lets it through.
  const leaving = useRef(false)

  const [row, setRow] = useState(item)
  const [baseline, setBaseline] = useState(() => toForm(spec, item))
  const [values, setValues] = useState(baseline)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ tone: StatusTone; text: string }>(() =>
    (location.state as { created?: boolean } | null)?.created ? { tone: 'ok', text: `${spec.singular} created.` } : { tone: 'info', text: '' },
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const dirty = JSON.stringify(values) !== JSON.stringify(baseline)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname,
  )

  // Closing the tab or reloading with unsaved changes gets the browser's own prompt.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const sections = sectionsFor(spec)
  const sitePath = sitePathFor(resource, row)
  const title = row ? String(row[spec.titleKey] ?? '') || `${spec.singular} ${row.id}` : `New ${spec.singular.toLowerCase()}`

  function setValue(key: string, value: FormValues[string]) {
    setValues((current) => ({ ...current, [key]: value }))
    if (status.tone === 'ok') setStatus({ tone: 'info', text: '' })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setStatus({ tone: 'info', text: 'Saving…' })
    const body = toPayload(spec, values)
    try {
      if (row) {
        const { item: saved } = await api<{ item: ContentRow }>(`/admin/content/${resource}/${row.id}`, { method: 'PUT', body })
        const next = toForm(spec, saved)
        setRow(saved)
        setBaseline(next)
        setValues(next)
        setIssues({})
        setStatus({ tone: 'ok', text: `Saved at ${formatClock(new Date())}.` })
      } else {
        const { item: created } = await api<{ item: ContentRow }>(`/admin/content/${resource}`, { method: 'POST', body })
        leaving.current = true
        navigate(`/admin/${resource}/${created.id}`, { replace: true, state: { created: true } })
      }
    } catch (error) {
      if (guard(error)) return
      const fieldIssues = error instanceof ApiError ? error.issues : {}
      setIssues(fieldIssues)
      // Issues the form can't point at (a key no field owns) go in the status line instead.
      const stray = Object.entries(fieldIssues)
        .filter(([key]) => !spec.fields.some((field) => key === field.key || key.startsWith(`${field.key}.`)))
        .map(([key, message]) => (key === '_' ? message : `${key}: ${message}`))
      setStatus({ tone: 'error', text: [messageFor(error), ...stray].join(' ') })
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setValues(baseline)
    setIssues({})
    setStatus({ tone: 'info', text: '' })
  }

  async function remove() {
    if (!row) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api(`/admin/content/${resource}/${row.id}`, { method: 'DELETE' })
      leaving.current = true
      navigate(`/admin/${resource}`, { replace: true })
    } catch (error) {
      if (guard(error)) return
      setDeleteError(messageFor(error))
      setDeleting(false)
    }
  }

  function renderGrid(section: FieldSection) {
    return (
      <div className={styles.grid}>
        {section.fields.map((field) => {
          const layout = layoutFor(resource, field.key)
          const wide = layout.wide || WIDE_TYPES.has(field.type) || field.key === spec.titleKey
          return (
            <div key={field.key} className={wide ? styles.wide : undefined}>
              <ContentField
                field={field}
                value={values[field.key]}
                issues={issues}
                rows={layout.rows}
                onChange={(value) => setValue(field.key, value)}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`${admin.page} ${admin.narrow}`}>
      <PageHeader
        title={title}
        tabTitle={row ? `${title} · ${spec.label}` : `New ${spec.singular.toLowerCase()}`}
        back={{ to: `/admin/${resource}`, label: spec.label }}
        lede={
          row ? (
            <p>
              {row.published ? 'On the site.' : <span className={admin.flagDraft}>Draft, so only admins see it.</span>}
              {row.placeholder && <span className={admin.flagSample}> Sample content.</span>} Last saved{' '}
              <span className={admin.figure}>{formatTimestamp(row.updatedAt)}</span>.
            </p>
          ) : (

            `Fill this in and save. It goes on the site once it’s published.`
          )
        }
        actions={
          row && (
            <>
              {sitePath && (
                // A new tab, so unsaved edits here stay put.
                <a className={admin.button} href={sitePath} target="_blank" rel="noreferrer">
                  View on site <ArrowOutIcon />
                </a>
              )}
              <button
                type="button"
                className={admin.danger}
                onClick={() => {
                  setDeleteError('')
                  setConfirmDelete(true)
                }}
              >
                Delete
              </button>
            </>
          )
        }
      />

      <form ref={formRef} className={styles.form} onSubmit={save} noValidate>
        {sections.length === 1 && sections[0].title === null ? (
          renderGrid(sections[0])
        ) : (
          <div className={styles.sections}>
            {sections.map((section, index) => {
              const headingId = `section-${index}`
              return (
                <section key={section.title} className={styles.section} aria-labelledby={headingId}>
                  <div className={styles.sectionHead}>
                    <h2 id={headingId} className={styles.sectionTitle}>
                      {section.title}
                    </h2>
                    {section.hint && <p className={admin.hint}>{section.hint}</p>}
                  </div>
                  {renderGrid(section)}
                </section>
              )
            })}
          </div>
        )}

        <div className={styles.bar}>
          <button type="submit" className={admin.primary} disabled={saving}>
            {saving ? 'Saving…' : row ? 'Save changes' : `Create ${spec.singular.toLowerCase()}`}
          </button>
          {dirty && !saving && (
            <button type="button" className={admin.ghost} onClick={discard}>
              Discard changes
            </button>
          )}
          <div className={styles.barStatus}>
            <StatusLine tone={status.tone}>{status.text || (dirty ? 'Unsaved changes.' : '')}</StatusLine>
          </div>
        </div>
      </form>

      {resource === 'events' && row && rsvps && <RsvpPanel eventId={row.id} initial={rsvps} />}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete this ${spec.singular.toLowerCase()}?`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>
          “{title}” comes off the site and out of the portal for good.
          {rsvps?.length ? ` Its ${rsvps.length} RSVPs go with it.` : ''} To hide it for now, untick Published
          instead.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        confirmLabel="Discard and leave"
        cancelLabel="Keep editing"
        danger
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        <p>Your changes to this {spec.singular.toLowerCase()} haven’t been saved.</p>
      </ConfirmDialog>
    </div>
  )
}
