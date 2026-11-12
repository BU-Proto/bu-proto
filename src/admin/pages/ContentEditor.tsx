import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useBlocker, useLoaderData, useNavigate } from 'react-router'
import { api, ApiError } from '../../lib/api'
import admin from '../admin.module.css'
import { RowState } from '../components/bits'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContentField } from '../components/ContentField'
import { ArrowOutIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { RsvpPanel } from '../components/RsvpPanel'
import { useToast } from '../lib/toast'
import { SAVE_KEYS, useSaveShortcut } from '../lib/keys'
import { layoutFor, sectionsFor, sitePathFor, specFor, toForm, toPayload, type ContentRow, type FieldSection, type FormValues } from '../lib/content'
import { formatRelative, formatTimestamp } from '../lib/format'
import { messageFor, useAuthGuard } from '../lib/session'
import type { contentEditorLoader } from '../loaders'
import styles from './ContentEditor.module.css'

// Wide fields take the whole row; short ones pair up on laptops.
const WIDE_TYPES = new Set(['textarea', 'list', 'links', 'people', 'images', 'image', 'boolean'])

// Where and whether a row shows, as opposed to what it says. These sit in the rail beside the
// form, the way a publishing box does in every editor people have used.
const RAIL_KEYS = new Set(['published', 'placeholder', 'position'])

const FORM_ID = 'content-editor'

export function Component() {
  const loaded = useLoaderData<typeof contentEditorLoader>()
  // A fresh editor per row, so moving between rows never carries a draft across.
  return <Editor key={`${loaded.resource}/${loaded.item?.id ?? 'new'}`} {...loaded} />
}

type Loaded = Awaited<ReturnType<typeof contentEditorLoader>>

function Editor({ resource, item, rsvps }: Loaded) {
  const spec = specFor(resource)
  const navigate = useNavigate()
  const guard = useAuthGuard()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  // Set right before navigating away on purpose (after a create or delete), so the blocker lets it through.
  const leaving = useRef(false)

  const [row, setRow] = useState(item)
  const [baseline, setBaseline] = useState(() => toForm(spec, item))
  const [values, setValues] = useState(baseline)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
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

  // The form's sections without the rail's fields; a section left empty by that (Publishing) goes.
  const sections = sectionsFor(spec)
    .map((section) => ({ ...section, fields: section.fields.filter((field) => !RAIL_KEYS.has(field.key)) }))
    .filter((section) => section.fields.length > 0)
  const railFields = spec.fields.filter((field) => RAIL_KEYS.has(field.key))
  const lower = spec.singular.toLowerCase()
  const sitePath = sitePathFor(resource, row)
  const title = row ? String(row[spec.titleKey] ?? '') || `${spec.singular} ${row.id}` : `New ${spec.singular.toLowerCase()}`

  function setValue(key: string, value: FormValues[string]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFailure('')
    const body = toPayload(spec, values)
    try {
      if (row) {
        const { item: saved } = await api<{ item: ContentRow }>(`/admin/content/${resource}/${row.id}`, { method: 'PUT', body })
        const next = toForm(spec, saved)
        setRow(saved)
        setBaseline(next)
        setValues(next)
        setIssues({})
        toast(`${spec.singular} saved`)
      } else {
        const { item: created } = await api<{ item: ContentRow }>(`/admin/content/${resource}`, { method: 'POST', body })
        leaving.current = true
        toast(`${spec.singular} created`)
        navigate(`/admin/${resource}/${created.id}`, { replace: true })
      }
    } catch (error) {
      if (guard(error)) return
      const fieldIssues = error instanceof ApiError ? error.issues : {}
      setIssues(fieldIssues)
      // Issues the form can't point at (a key no field owns) go in the status line instead.
      const stray = Object.entries(fieldIssues)
        .filter(([key]) => !spec.fields.some((field) => key === field.key || key.startsWith(`${field.key}.`)))
        .map(([key, message]) => (key === '_' ? message : `${key}: ${message}`))
      setFailure([messageFor(error), ...stray].join(' '))
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setValues(baseline)
    setIssues({})
    setFailure('')
  }

  async function remove() {
    if (!row) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api(`/admin/content/${resource}/${row.id}`, { method: 'DELETE' })
      leaving.current = true
      toast(`${spec.singular} deleted`)
      navigate(`/admin/${resource}`, { replace: true })
    } catch (error) {
      if (guard(error)) return
      setDeleteError(messageFor(error))
      setDeleting(false)
    }
  }

  // ⌘S saves what's on screen, through the form, so its own checks still run.
  const submit = useCallback(() => formRef.current?.requestSubmit(), [])
  useSaveShortcut(submit, (dirty || !row) && !saving)

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
    <div className={admin.page}>
      <PageHeader
        title={title}
        tabTitle={row ? `${title} · ${spec.label}` : `New ${lower}`}
        back={{ to: `/admin/${resource}`, label: spec.label }}
        actions={
          <>
            {/* What the form is waiting on, said next to the button that settles it. */}
            <span className={styles.saveState} role="status">
              {saving ? 'Saving…' : dirty ? 'Unsaved changes' : ''}
            </span>
            {dirty && !saving && (
              <button type="button" className={admin.ghost} onClick={discard}>
                Discard
              </button>
            )}
            {sitePath && (
              // A new tab, so unsaved edits here stay put.
              <a className={admin.button} href={sitePath} target="_blank" rel="noreferrer">
                View on site <ArrowOutIcon />
              </a>
            )}
            {/* Outside the form in the DOM (it rides in the bar), tied to it by id. */}
            <button type="submit" form={FORM_ID} className={admin.primary} disabled={saving || (Boolean(row) && !dirty)} title={`${SAVE_KEYS} saves too`}>
              {row ? 'Save changes' : `Create ${lower}`}
            </button>
          </>
        }
      />

      <div className={styles.callout} role="alert" hidden={!failure}>
        {failure}
      </div>

      <form id={FORM_ID} ref={formRef} className={styles.layout} onSubmit={save} noValidate>
        <div className={styles.main}>
          {sections.map((section, index) => {
            const headingId = `section-${index}`
            return (
              <section key={section.title ?? index} className={styles.section} aria-labelledby={section.title ? headingId : undefined}>
                {section.title && (
                  <div className={styles.sectionHead}>
                    <h2 id={headingId} className={styles.sectionTitle}>
                      {section.title}
                    </h2>
                    {section.hint && <p className={admin.hint}>{section.hint}</p>}
                  </div>
                )}
                {renderGrid(section)}
              </section>
            )
          })}
        </div>

        <aside className={styles.rail} aria-label="Publishing">
          <section className={styles.railPanel}>
            <div className={styles.railHead}>
              <h2 className={styles.sectionTitle}>Publishing</h2>
              <RowState placeholder={Boolean(values.placeholder)} published={Boolean(values.published)} />
            </div>
            <div className={styles.railFields}>
              {railFields.map((field) => (
                <ContentField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  issues={issues}
                  onChange={(value) => setValue(field.key, value)}
                />
              ))}
            </div>
            {row && (
              <dl className={styles.facts}>
                <div>
                  <dt>Last saved</dt>
                  <dd title={formatTimestamp(row.updatedAt)}>{formatRelative(row.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd className={admin.figure}>{formatTimestamp(row.createdAt)}</dd>
                </div>
              </dl>
            )}
          </section>

          {row && (
            // On its own, away from Save and the fields, so it's never hit by a slip.
            <button
              type="button"
              className={admin.dangerGhost}
              onClick={() => {
                setDeleteError('')
                setConfirmDelete(true)
              }}
            >
              <TrashIcon /> Delete {lower}
            </button>
          )}
        </aside>
      </form>

      {resource === 'events' && row && rsvps && (
        <div className={styles.below}>
          <RsvpPanel eventId={row.id} initial={rsvps} />
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete this ${lower}?`}
        confirmLabel={`Delete ${lower}`}
        cancelLabel={`Keep ${lower}`}
        danger
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>
          “{title}” comes off the site and out of the portal for good.
          {rsvps?.length ? ` Its ${rsvps.length} RSVPs go with it.` : ''}
        </p>
        <p>To hide it for now, switch Published off instead.</p>
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
        <p>Your changes to this {lower} haven’t been saved.</p>
      </ConfirmDialog>
    </div>
  )
}
