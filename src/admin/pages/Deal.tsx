import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  type DealDetail,
  type DealStage,
  type DealType,
  type FollowUp,
} from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import ui from '../admin.module.css'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { Segmented } from '../components/FormDialog'
import { PlusIcon, TrashIcon } from '../components/icons'
import { LogInteraction } from '../components/LogInteraction'
import { MakeIntro } from '../components/MakeIntro'
import { PageHeader } from '../components/PageHeader'
import { PersonPicker, type PickedPerson } from '../components/PersonPicker'
import { useGated } from '../lib/access'
import {
  DEAL_TYPE_TONES,
  addDays,
  bostonToday,
  dueLabel,
  formatCents,
  formatDay,
  formatPastDay,
  initials,
  parseDollars,
  useOfferSponsorWall,
  useOwners,
} from '../lib/activity'
import type { ContentRow } from '../lib/content'
import { formatRelative } from '../lib/format'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import { useApi } from './people/useApi'
import styles from './Deal.module.css'

/** One deal: where it stands, what it is, who it's with, what happened and what's owed next. */
export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const guard = useAuthGuard()
  const gated = useGated()('partnerships')
  const offerWall = useOfferSponsorWall()
  const { data, error, setData, reload } = useApi<{ item: DealDetail }>(`/admin/deals/${id}`)
  const deal = data?.item
  const [logging, setLogging] = useState(false)
  const [introducing, setIntroducing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  /** PATCH the deal and show what comes back; true when it saved. */
  async function patch(body: Record<string, unknown>, done?: string): Promise<boolean> {
    setBusy(true)
    try {
      const { item } = await api<{ item: DealDetail }>(`/admin/deals/${id}`, { method: 'PATCH', body })
      setData(() => ({ item }))
      if (done) toast(done)
      return true
    } catch (failure) {
      if (guard(failure)) return false
      toast({ text: 'Couldn’t save that', detail: messageFor(failure), tone: 'error' })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function moveTo(stage: DealStage) {
    if (!deal || stage === deal.stage) return
    if ((await patch({ stage }, `Moved to ${DEAL_STAGE_LABELS[stage]}`)) && stage === 'committed') void offerWall(deal)
  }

  async function remove() {
    setDeleteError('')
    try {
      await api(`/admin/deals/${id}`, { method: 'DELETE' })
      toast('Deal deleted')
      navigate('/admin/pipeline', { replace: true })
    } catch (failure) {
      if (guard(failure)) return
      setDeleteError(messageFor(failure))
    }
  }

  if (error && !deal) {
    return (
      <div className={ui.page}>
        <PageHeader title="Deal" back={{ to: '/admin/pipeline', label: 'Pipeline' }} />
        <div className={ui.callout} role="alert">
          <h2>{error.status === 404 ? 'That deal isn’t here' : 'Couldn’t load this deal'}</h2>
          <p>{error.status === 404 ? 'It may have been deleted.' : error.message}</p>
          <div className={ui.actions}>
            <Link to="/admin/pipeline" className={ui.button}>
              Back to Pipeline
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className={ui.page}>
        <PageHeader title="Deal" back={{ to: '/admin/pipeline', label: 'Pipeline' }} />
        <div className={ui.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 200, marginBottom: 14 }} />
          <span className={ui.skeleton} style={{ width: 320 }} />
        </div>
      </div>
    )
  }

  const passed = deal.passedAt !== null
  const stageIndex = DEAL_STAGES.indexOf(deal.stage)

  return (
    <div className={ui.page}>
      <PageHeader
        title={deal.title}
        tabTitle={`${deal.title} · Pipeline`}
        back={{ to: '/admin/pipeline', label: 'Pipeline' }}
        count={deal.orgName}
        actions={
          <>
            {passed ? (
              <button type="button" className={ui.button} onClick={() => patch({ passed: false }, 'Back on the board')} disabled={busy || gated.disabled} title={gated.title}>
                Reopen
              </button>
            ) : (
              <button type="button" className={ui.danger} onClick={() => patch({ passed: true }, 'Marked passed. It’s off the board.')} disabled={busy || gated.disabled} title={gated.title}>
                Mark passed
              </button>
            )}
            <button type="button" className={ui.primary} onClick={() => setLogging(true)}>
              <PlusIcon /> Log interaction
            </button>
          </>
        }
      />

      {passed && (
        <p className={styles.passedNote}>
          Passed {formatRelative(deal.passedAt)} at {DEAL_STAGE_LABELS[deal.stage]}. It’s off the board; Reopen brings it back where it was.
        </p>
      )}

      <div className={`${ui.tabs} ${styles.stepper}`} role="group" aria-label="Stage">
        {DEAL_STAGES.map((stage, index) => (
          <button
            key={stage}
            type="button"
            className={`${ui.tab} ${styles.step}`}
            aria-pressed={stage === deal.stage}
            data-done={index < stageIndex || undefined}
            disabled={busy || passed || gated.disabled}
            title={gated.title ?? (passed ? 'Reopen the deal to move it.' : `Move to ${DEAL_STAGE_LABELS[stage]}`)}
            onClick={() => moveTo(stage)}
          >
            <span className={styles.stepNum} aria-hidden="true">
              {index + 1}
            </span>
            {DEAL_STAGE_LABELS[stage]}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          {editing ? (
            <DealEditor
              deal={deal}
              onCancel={() => setEditing(false)}
              onSaved={(item) => {
                setData(() => ({ item }))
                setEditing(false)
                toast('Deal saved')
              }}
              onDelete={() => {
                setDeleteError('')
                setConfirmDelete(true)
              }}
            />
          ) : (
            <DealDetails deal={deal} gated={gated} onEdit={() => setEditing(true)} />
          )}
          <History deal={deal} />
        </div>

        <aside className={styles.aside}>
          <section className={ui.panelFlush} aria-labelledby="deal-contact">
            <div className={ui.flushHead}>
              <h2 id="deal-contact" className={ui.panelTitle}>
                Contact
              </h2>
            </div>
            <div className={styles.contact}>
              {deal.contact ? (
                <>
                  <div className={ui.person}>
                    <span className={ui.avatar} aria-hidden="true">
                      {initials(deal.contact.name)}
                    </span>
                    <div className={styles.contactText}>
                      <Link to={`/admin/people/${deal.contact.key}`} className={ui.rowTitle}>
                        {deal.contact.name}
                      </Link>
                      <span className={ui.dim}>{deal.contact.orgName ?? deal.orgName}</span>
                    </div>
                  </div>
                  <div className={ui.actions}>
                    <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => setLogging(true)}>
                      Log interaction
                    </button>
                    <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => setIntroducing(true)}>
                      Make intro
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.quiet}>
                  No one named yet.{' '}
                  {!gated.disabled && (
                    <button type="button" className={ui.link} onClick={() => setEditing(true)}>
                      Add a contact
                    </button>
                  )}
                </p>
              )}
            </div>
          </section>

          <FollowUps deal={deal} onChange={reload} />

          {deal.type === 'sponsor' && (
            <section className={`${ui.panel} ${styles.aboutPanel}`}>
              <h2 className={ui.panelTitle}>When it commits</h2>
              <p className={styles.quiet}>Moving it to Committed offers to put {deal.orgName} on the Sponsors logo wall.</p>
            </section>
          )}
        </aside>
      </div>

      <LogInteraction
        open={logging}
        personKey={deal.contact?.key ?? null}
        person={deal.contact}
        orgId={deal.orgId}
        dealId={deal.id}
        onClose={() => setLogging(false)}
        onLogged={reload}
      />
      <MakeIntro open={introducing} contactKey={deal.contact?.key ?? null} onClose={() => setIntroducing(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this deal?"
        confirmLabel="Delete deal"
        cancelLabel="Keep it"
        danger
        error={deleteError}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>“{deal.title}” and its follow-ups go for good. What was logged on it stays in Activity. To drop it but keep the record, mark it passed instead.</p>
      </ConfirmDialog>
    </div>
  )
}

function DealDetails({ deal, gated, onEdit }: { deal: DealDetail; gated: ReturnType<ReturnType<typeof useGated>>; onEdit: () => void }) {
  const { labelFor } = useOwners()
  const due = deal.nextFollowUp ? dueLabel(deal.nextFollowUp.dueOn) : null
  return (
    <section className={ui.panelFlush} aria-labelledby="deal-details">
      <div className={ui.flushHead}>
        <h2 id="deal-details" className={ui.panelTitle}>
          Details
        </h2>
        <div className={ui.flushStatus} />
        <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={onEdit} {...gated}>
          Edit
        </button>
      </div>
      <dl className={styles.facts}>
        <dt>Org</dt>
        <dd>
          <Link to={`/admin/orgs/${deal.orgId}`} className={styles.link}>
            {deal.orgName}
          </Link>
        </dd>
        <dt>Contact</dt>
        <dd>
          {deal.contact ? (
            <Link to={`/admin/people/${deal.contact.key}`} className={styles.link}>
              {deal.contact.name}
            </Link>
          ) : (
            <span className={ui.dim}>No one yet</span>
          )}
        </dd>
        <dt>Type</dt>
        <dd>
          <span className={ui.state} data-tone={DEAL_TYPE_TONES[deal.type]}>
            {DEAL_TYPE_LABELS[deal.type]}
          </span>
        </dd>
        <dt>Ask</dt>
        <dd>{deal.ask || <span className={ui.dim}>Not set</span>}</dd>
        {/* The amount only when the ask doesn't already say it ("$3,000" twice reads as a mistake). */}
        {deal.amountCents !== null && deal.ask.replace(/\s/g, '') !== formatCents(deal.amountCents) && (
          <>
            <dt>Amount</dt>
            <dd className={ui.figure}>{formatCents(deal.amountCents)}</dd>
          </>
        )}
        <dt>Owner</dt>
        <dd>{labelFor(deal.ownerEmail)}</dd>
        <dt>Next follow-up</dt>
        <dd>
          {due && deal.nextFollowUp ? (
            <span className={styles.due} data-tone={due.tone}>
              {deal.nextFollowUp.title} · {due.text}
            </span>
          ) : (
            <span className={ui.dim}>Nothing owed</span>
          )}
        </dd>
        {deal.eventId !== null && (
          <>
            <dt>Event</dt>
            <dd>
              <Link to={`/admin/events/${deal.eventId}`} className={styles.link}>
                {deal.eventTitle ?? `Event ${deal.eventId}`}
              </Link>
            </dd>
          </>
        )}
        {deal.notes && (
          <>
            <dt>Notes</dt>
            <dd className={styles.notes}>{deal.notes}</dd>
          </>
        )}
      </dl>
    </section>
  )
}

/** The details, editable: everything but the org (a deal stays with the org it was made for). */
function DealEditor({ deal, onCancel, onSaved, onDelete }: { deal: DealDetail; onCancel: () => void; onSaved: (deal: DealDetail) => void; onDelete: () => void }) {
  const guard = useAuthGuard()
  const { owners } = useOwners()
  const events = useApi<{ items: ContentRow[] }>('/admin/content/events')
  const [type, setType] = useState<DealType>(deal.type)
  const [title, setTitle] = useState(deal.title)
  const [ask, setAsk] = useState(deal.ask)
  const [amount, setAmount] = useState(deal.amountCents === null ? '' : String(deal.amountCents / 100))
  const [owner, setOwner] = useState(deal.ownerEmail ?? '')
  const [contact, setContact] = useState<PickedPerson | null>(deal.contact && { key: deal.contact.key, name: deal.contact.name, detail: deal.contact.orgName ?? '' })
  const [eventId, setEventId] = useState(deal.eventId === null ? '' : String(deal.eventId))
  const [notes, setNotes] = useState(deal.notes)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)

  // Someone who owned it but isn't an admin any more still shows, so saving doesn't drop them.
  const ownerOptions = owner && !owners.some((option) => option.email === owner.toLowerCase()) ? [...owners, { email: owner, label: owner }] : owners
  const eventList = [...(events.data?.items ?? [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))

  async function save(event: FormEvent) {
    event.preventDefault()
    const amountCents = parseDollars(amount)
    const local: Record<string, string> = {}
    if (!title.trim()) local.title = 'Say what the deal is.'
    if (amountCents === undefined) local.amountCents = 'Enter dollars, like 3000.'
    if (Object.keys(local).length) {
      setIssues(local)
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const { item } = await api<{ item: DealDetail }>(`/admin/deals/${deal.id}`, {
        method: 'PATCH',
        body: {
          type,
          title,
          ask,
          amountCents,
          ownerEmail: owner || null,
          contactKey: contact?.key ?? null,
          eventId: eventId ? Number(eventId) : null,
          notes,
        },
      })
      onSaved(item)
    } catch (error) {
      if (guard(error)) return
      setIssues(error instanceof ApiError ? error.issues : {})
      setFailure(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={ui.panel} onSubmit={save} noValidate aria-labelledby="deal-edit">
      <div className={ui.panelHead}>
        <h2 id="deal-edit" className={ui.panelTitle}>
          Edit details
        </h2>
      </div>
      <div className={styles.editGrid}>
        <fieldset className={`${ui.field} ${styles.wide}`}>
          <legend className={styles.legend}>Type</legend>
          <Segmented label="Type" options={DEAL_TYPES.map((value) => ({ value, label: DEAL_TYPE_LABELS[value] }))} value={type} onChange={setType} />
        </fieldset>
        <div className={styles.wide}>
          <Field label="What it is" error={issues.title}>
            {(control) => <input {...control} className={ui.input} value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} />}
          </Field>
        </div>
        <Field label="Ask" error={issues.ask}>
          {(control) => <input {...control} className={ui.input} value={ask} maxLength={120} onChange={(event) => setAsk(event.target.value)} />}
        </Field>
        <Field label="Amount" hint="Dollars" error={issues.amountCents}>
          {(control) => <input {...control} className={ui.input} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />}
        </Field>
        <Field label="Contact" error={issues.contactKey}>
          {(control) => <PersonPicker {...control} value={contact} onChange={setContact} kinds={['contact', 'alum']} placeholder="Who there" />}
        </Field>
        <Field label="Owner" error={issues.ownerEmail}>
          {(control) => (
            <select {...control} className={ui.input} value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option value="">No one</option>
              {ownerOptions.map((option) => (
                <option key={option.email} value={option.email}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className={styles.wide}>
          <Field label="Event" hint="The event it's for, if any" error={issues.eventId}>
            {(control) => (
              <select {...control} className={ui.input} value={eventId} onChange={(event) => setEventId(event.target.value)}>
                <option value="">None</option>
                {eventList.map((row) => (
                  <option key={row.id} value={row.id}>
                    {String(row.title)} · {formatDay(String(row.date))}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <div className={styles.wide}>
          <Field label="Notes" error={issues.notes}>
            {(control) => <textarea {...control} className={ui.input} rows={4} value={notes} maxLength={4000} onChange={(event) => setNotes(event.target.value)} />}
          </Field>
        </div>
      </div>
      <p className={ui.error} role="alert" hidden={!failure}>
        {failure}
      </p>
      <div className={styles.editActions}>
        <button type="button" className={ui.dangerGhost} onClick={onDelete} disabled={saving}>
          <TrashIcon /> Delete deal
        </button>
        <span className={styles.spacer} />
        <button type="button" className={ui.button} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className={ui.primary} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function History({ deal }: { deal: DealDetail }) {
  const { labelFor } = useOwners()
  return (
    <section className={ui.panelFlush} aria-labelledby="deal-history">
      <div className={ui.flushHead}>
        <h2 id="deal-history" className={ui.panelTitle}>
          History
        </h2>
      </div>
      <ol className={styles.timeline}>
        {deal.timeline.map((item, index) => (
          <li key={`${item.kind}-${item.at}-${index}`} className={styles.event}>
            <span className={styles.eventLabel} data-kind={item.kind}>
              {item.label}
            </span>
            <div className={styles.eventText}>
              {item.href ? (
                <Link to={item.href} className={styles.eventTitle}>
                  {item.title}
                </Link>
              ) : (
                <span className={styles.eventTitle}>{item.title}</span>
              )}
              {item.detail && <span className={styles.eventDetail}>{item.detail}</span>}
            </div>
            <div className={styles.eventWhen}>
              <span>{item.at.length === 10 ? formatPastDay(item.at) : formatRelative(item.at)}</span>
              {item.by && (
                <span className={styles.eventBy} title={labelFor(item.by)}>
                  {initials(item.by)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** The deal's follow-ups: tick one off, add one. Ticked ones fold away under "Show done". */
function FollowUps({ deal, onChange }: { deal: DealDetail; onChange: () => void }) {
  const toast = useToast()
  const guard = useAuthGuard()
  const { owners, me, labelFor } = useOwners()
  const [showDone, setShowDone] = useState(false)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(() => addDays(bostonToday(), 3))
  const [owner, setOwner] = useState(deal.ownerEmail ?? me)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const open = deal.followUps.filter((item) => !item.doneAt)
  const done = deal.followUps.filter((item) => item.doneAt)
  const shown = showDone ? [...open, ...done] : open

  async function tick(item: FollowUp) {
    try {
      await api(`/admin/follow-ups/${item.id}`, { method: 'PATCH', body: { done: !item.doneAt } })
      toast(item.doneAt ? 'Back on the list' : 'Done')
      onChange()
    } catch (failure) {
      if (guard(failure)) return
      toast({ text: 'Couldn’t change that follow-up', detail: messageFor(failure), tone: 'error' })
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Say what needs doing.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api('/admin/follow-ups', {
        body: { title, dueOn: due, ownerEmail: owner, personKey: deal.contact?.key ?? null, orgId: deal.orgId, dealId: deal.id },
      })
      toast('Follow-up added')
      setTitle('')
      setAdding(false)
      onChange()
    } catch (failure) {
      if (guard(failure)) return
      setError(messageFor(failure))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={ui.panelFlush} aria-labelledby="deal-follow-ups">
      <div className={ui.flushHead}>
        <h2 id="deal-follow-ups" className={ui.panelTitle}>
          Follow-ups <span className={ui.count}>{open.length}</span>
        </h2>
        <div className={ui.flushStatus} />
        {!adding && (
          <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setAdding(true)}>
            <PlusIcon /> Add
          </button>
        )}
      </div>
      {adding && (
        <form className={styles.addFollowUp} onSubmit={add} noValidate>
          <input
            className={ui.input}
            aria-label="What needs doing"
            placeholder="Send the one-pager"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          <div className={styles.addRow}>
            <input className={ui.input} type="date" aria-label="Due" value={due} onChange={(event) => setDue(event.target.value)} />
            <select className={ui.input} aria-label="Owner" value={owner} onChange={(event) => setOwner(event.target.value)}>
              {owners.map((option) => (
                <option key={option.email} value={option.email}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className={ui.error} role="alert" hidden={!error}>
            {error}
          </p>
          <div className={ui.actions}>
            <button type="submit" className={`${ui.primary} ${ui.small}`} disabled={saving}>
              {saving ? 'Adding…' : 'Add follow-up'}
            </button>
            <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setAdding(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {shown.length === 0 && !adding ? (
        <p className={`${styles.quiet} ${styles.pad}`}>Nothing owed on this deal.</p>
      ) : (
        <ul className={styles.followUps}>
          {shown.map((item) => {
            const tone = item.doneAt ? null : dueLabel(item.dueOn)
            return (
              <li key={item.id} className={styles.followUp} data-done={Boolean(item.doneAt) || undefined}>
                <input type="checkbox" className={styles.check} checked={Boolean(item.doneAt)} onChange={() => tick(item)} aria-label={`Done: ${item.title}`} />
                <div className={styles.followUpText}>
                  <span className={styles.followUpTitle}>{item.title}</span>
                  <span className={styles.followUpMeta}>
                    {tone ? (
                      <span className={styles.due} data-tone={tone.tone}>
                        {tone.text}
                      </span>
                    ) : (
                      <span>Done {formatRelative(item.doneAt)}</span>
                    )}
                    {' · '}
                    {labelFor(item.ownerEmail)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {done.length > 0 && (
        <div className={styles.showDone}>
          <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setShowDone((value) => !value)} aria-expanded={showDone}>
            {showDone ? 'Hide done' : `Show done (${done.length})`}
          </button>
        </div>
      )}
    </section>
  )
}
