import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  DEAL_STAGE_LABELS,
  DEAL_TYPE_LABELS,
  ORG_KINDS,
  ORG_KIND_LABELS,
  type OrgDetail,
  type OrgKind,
  type OrgPatch,
  type Wall,
} from '../../../shared/crm'
import { whoCanChange } from '../../../shared/access'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { FormDialog } from '../components/FormDialog'
import { LogInteraction } from '../components/LogInteraction'
import { ChevronRightIcon, PlusIcon, UploadIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useCan, useGated } from '../lib/access'
import { useToast } from '../lib/toast'
import { UPLOAD_ACCEPT, uploadPicture } from '../lib/upload'
import styles from './crm/crm.module.css'
import { formatAt, initials, isoOf, teammate } from './crm/format'
import { NewPerson } from './crm/NewPerson'
import { Due, FollowUpsPanel, IntrosPanel, TimelinePanel } from './crm/panels'
import { useTeam } from './crm/data'
import { OwnerAvatar, OwnerSelect } from './crm/pickers'
import { SetFollowUp } from './crm/SetFollowUp'
import { ConfirmDialog } from './people/ConfirmDialog'
import { toApiError, useApi } from './people/useApi'
import { SegmentGroup } from '../components/SegmentGroup'

// One org: its deals, people, what happened with them, and its spot on the logo walls.

export function Component() {
  const { id = '' } = useParams()
  const { data, error, loading, reload, setData } = useApi<{ item: OrgDetail }>(`/admin/orgs/${encodeURIComponent(id)}`)
  const org = data?.item

  if (!org || String(org.id) !== id) {
    return (
      <div className={ui.page}>
        <PageHeader title={loading ? 'Org' : 'Not found'} back={{ to: '/admin/orgs', label: 'Orgs' }} />
        {loading ? (
          <div className={ui.panel} aria-hidden="true">
            <span className={ui.skeleton} style={{ width: 180, marginBottom: 14 }} />
            <span className={ui.skeleton} style={{ width: 260 }} />
          </div>
        ) : (
          <p className={ui.error} role="alert">
            {error?.status === 404 ? 'That org doesn’t exist, or was deleted.' : error?.message}
          </p>
        )}
      </div>
    )
  }
  return <Detail org={org} reload={reload} replace={(item) => setData(() => ({ item }))} />
}

function Detail({ org, reload, replace }: { org: OrgDetail; reload: () => void; replace: (org: OrgDetail) => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [dialog, setDialog] = useState<'follow-up' | 'log' | 'contact' | 'delete' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const openDeals = org.deals.filter((deal) => !deal.passedAt && deal.stage !== 'delivered')
  const [allDeals, setAllDeals] = useState(false)
  const deals = allDeals ? org.deals : openDeals

  const remove = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api(`/admin/orgs/${org.id}`, { method: 'DELETE' })
      toast(`${org.name} deleted`)
      navigate('/admin/orgs', { replace: true })
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
      setDeleting(false)
    }
  }

  return (
    <div className={ui.page} data-fit>
      <PageHeader
        title={org.name}
        tabTitle={`${org.name} · Orgs`}
        count={ORG_KIND_LABELS[org.kind]}
        back={{ to: '/admin/orgs', label: 'Orgs' }}
        actions={
          <>
            <button type="button" className={ui.button} onClick={() => setDialog('follow-up')}>
              Set follow-up
            </button>
            <button type="button" className={ui.primary} onClick={() => setDialog('log')}>
              <PlusIcon /> Log interaction
            </button>
          </>
        }
      />

      {/* A bento that fits the screen: deals and the next step across the top; under them the
          timeline as the tall box, the people, events and intros in the middle, and the details
          and logo wall on the right. Each box scrolls inside when it holds more. */}
      <div className={`${ui.bento} ${styles.orgBento}`}>
        <div className={`${ui.cell} ${styles.cellDeals}`}>
          <section className={ui.panelFlush} aria-labelledby="deals-title">
            <div className={ui.flushHead}>
              <h2 id="deals-title" className={`${ui.panelTitle} ${ui.flushStatus}`}>
                {allDeals ? 'Deals' : 'Open deals'} <span className={ui.count}>{deals.length}</span>
              </h2>
              {org.deals.length > openDeals.length && (
                <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setAllDeals(!allDeals)}>
                  {allDeals ? 'Only open ones' : `Show all ${org.deals.length}`}
                </button>
              )}
            </div>
            {deals.length === 0 ? (
              <p className={styles.none}>No open deals with {org.name}. Deals are made in Pipeline.</p>
            ) : (
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col">Deal</th>
                    <th scope="col">Stage</th>
                    <th scope="col">Ask</th>
                    <th scope="col">Next</th>
                    <th scope="col">Owner</th>
                    <th scope="col" className={ui.rowGo}>
                      <span className={ui.srOnly}>Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <span className={styles.cellText}>
                          <Link to={`/admin/pipeline/${deal.id}`} className={ui.rowTitle}>
                            {deal.title}
                          </Link>
                          <span className={styles.sub}>{[DEAL_TYPE_LABELS[deal.type], deal.contact?.name].filter(Boolean).join(' · ')}</span>
                        </span>
                      </td>
                      <td data-label="Stage" className={styles.soft}>
                        {deal.passedAt ? 'Passed' : DEAL_STAGE_LABELS[deal.stage]}
                      </td>
                      <td data-label="Ask" className={ui.figure}>
                        {deal.ask}
                      </td>
                      <td data-label="Next" className={styles.small}>
                        {deal.nextFollowUp ? <Due dueOn={deal.nextFollowUp.dueOn} /> : <span className={ui.dim}>None</span>}
                      </td>
                      <td data-label="Owner">
                        <OwnerAvatar email={deal.ownerEmail} />
                      </td>
                      <td className={ui.rowGo} aria-hidden="true">
                        <ChevronRightIcon />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className={`${ui.cell} ${styles.cellTimeline}`}>
          <TimelinePanel items={org.timeline} />
        </div>

        <div className={`${ui.cell} ${styles.cellNext}`}>
          <FollowUpsPanel
            items={org.followUps}
            onChanged={reload}
            action={
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setDialog('follow-up')}>
                Set follow-up
              </button>
            }
          />
        </div>

        <div className={`${ui.cell} ${styles.cellDetails}`}>
          <OrgDetailsPanel org={org} onSaved={replace} onDelete={() => setDialog('delete')} />
        </div>

        <div className={`${ui.cell} ${styles.cellWall}`}>
          <LogoWallPanel org={org} onSaved={replace} />
        </div>

        <div className={`${ui.cell} ${styles.cellContacts}`}>
          <section className={ui.panelFlush} aria-labelledby="contacts-title">
            <div className={ui.flushHead}>
              <h2 id="contacts-title" className={`${ui.panelTitle} ${ui.flushStatus}`}>
                Contacts <span className={ui.count}>{org.contacts.length}</span>
              </h2>
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setDialog('contact')}>
                <PlusIcon /> Add
              </button>
            </div>
            {org.contacts.length === 0 ? (
              <p className={styles.none}>No one here yet.</p>
            ) : (
              <ul className={styles.list}>
                {org.contacts.map((person) => (
                  <li key={person.key}>
                    <span className={ui.avatar} aria-hidden="true">
                      {initials(person.name)}
                    </span>
                    <div className={styles.grow}>
                      <Link to={`/admin/people/${person.key}`} className={styles.t1}>
                        {person.name}
                      </Link>
                      <span className={styles.t2}>
                        {[person.title, person.lastTouch && `${person.lastTouch.label} ${formatAt(person.lastTouch.at)}`].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={`${ui.cell} ${styles.cellEvents}`}>
          <section className={ui.panelFlush} aria-labelledby="events-title">
            <div className={ui.flushHead}>
              <h2 id="events-title" className={ui.panelTitle}>
                Events <span className={ui.count}>{org.events.length}</span>
              </h2>
            </div>
            {org.events.length === 0 ? (
              <p className={styles.none}>Not at any events yet.</p>
            ) : (
              <ul className={styles.list}>
                {org.events.map((event, index) => (
                  <li key={`${event.eventId}-${index}`}>
                    <div className={styles.grow}>
                      <Link to={`/admin/events/${event.eventId}`} className={styles.t1}>
                        {event.title}
                      </Link>
                      <span className={styles.t2}>
                        {event.role.charAt(0).toUpperCase() + event.role.slice(1)} · {event.personName}
                      </span>
                    </div>
                    <time className={styles.end} dateTime={isoOf(event.date)}>
                      {formatAt(event.date)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={`${ui.cell} ${styles.cellIntros}`}>
          <IntrosPanel items={org.intros} />
        </div>
      </div>

      <SetFollowUp
        open={dialog === 'follow-up'}
        orgId={org.id}
        ownerEmail={org.ownerEmail}
        about={org.name}
        onClose={() => setDialog(null)}
        onSaved={() => {
          setDialog(null)
          reload()
        }}
      />
      <LogInteraction
        open={dialog === 'log'}
        orgId={org.id}
        onClose={() => setDialog(null)}
        onLogged={() => {
          setDialog(null)
          reload()
        }}
      />
      <NewPerson
        open={dialog === 'contact'}
        initialOrgId={org.id}
        onClose={() => setDialog(null)}
        onCreated={() => {
          setDialog(null)
          reload()
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title={`Delete ${org.name}?`}
        confirmLabel="Delete org"
        danger
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setDialog(null)
          setDeleteError('')
        }}
      >
        <p>
          Its {org.contacts.length === 1 ? 'contact stays' : 'contacts stay'} in People, without an org. An org with deals can’t be deleted until they’re
          gone from Pipeline.
        </p>
      </ConfirmDialog>
    </div>
  )
}

// ---- Details ----------------------------------------------------------------------------------

type OrgDraft = { name: string; kind: OrgKind; website: string; focus: string; ownerEmail: string; notes: string }

const orgDraft = (org: OrgDetail): OrgDraft => ({
  name: org.name,
  kind: org.kind,
  website: org.website,
  focus: org.focus,
  ownerEmail: org.ownerEmail ?? '',
  notes: org.notes,
})

/** What's on file, to read. Edit opens the same fields in a dialog. */
function OrgDetailsPanel({ org, onSaved, onDelete }: { org: OrgDetail; onSaved: (org: OrgDetail) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const none = (text: string) => <span className={ui.dim}>{text}</span>

  return (
    <section className={ui.panelFlush} aria-labelledby="org-details-title">
      <div className={ui.flushHead}>
        <h2 id="org-details-title" className={`${ui.panelTitle} ${ui.flushStatus}`}>
          Details
        </h2>
        <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <dl className={`${styles.kv} ${styles.facts}`}>
        <dt>Owner</dt>
        <dd>{org.ownerEmail ? teammate(org.ownerEmail) : none('No one yet')}</dd>
        <dt>Kind</dt>
        <dd>{org.kind === 'hackathon' ? 'Hackathon organizer' : ORG_KIND_LABELS[org.kind]}</dd>
        <dt>Website</dt>
        <dd>
          {/^https?:\/\//.test(org.website) ? (
            <a href={org.website} target="_blank" rel="noreferrer" className={`${ui.link} ${styles.factLink}`} title={org.website}>
              {org.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          ) : (
            org.website || none('None')
          )}
        </dd>
        <dt>Focus</dt>
        <dd>{org.focus || none('Not set')}</dd>
        <dt>Notes</dt>
        <dd className={styles.factNotes}>{org.notes || none('None')}</dd>
      </dl>

      {editing && (
        <EditOrg
          org={org}
          onClose={() => setEditing(false)}
          onSaved={(item) => {
            setEditing(false)
            onSaved(item)
          }}
          onDelete={() => {
            setEditing(false)
            onDelete()
          }}
        />
      )}
    </section>
  )
}

/**
 * The Edit dialog. Mounted only while open, so each opening starts from what's saved. Deleting
 * starts here too, on the far side from Save, and still asks before it does anything.
 */
function EditOrg({ org, onClose, onSaved, onDelete }: { org: OrgDetail; onClose: () => void; onSaved: (org: OrgDetail) => void; onDelete: () => void }) {
  const toast = useToast()
  const team = useTeam()
  const saved = orgDraft(org)
  const [draft, setDraft] = useState(saved)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})
  const changed = (Object.keys(draft) as (keyof OrgDraft)[]).filter((field) => draft[field] !== saved[field])
  const set = <K extends keyof OrgDraft>(field: K, value: OrgDraft[K]) => setDraft((prev) => ({ ...prev, [field]: value }))

  const save = async () => {
    if (saving) return
    if (changed.length === 0) {
      onClose()
      return
    }
    setSaving(true)
    setFormError('')
    setIssues({})
    try {
      // Only what changed: the server applies exactly the fields it's sent.
      const patch = Object.fromEntries(changed.map((field) => [field, draft[field]])) as OrgPatch
      const { item } = await api<{ item: OrgDetail }>(`/admin/orgs/${org.id}`, { method: 'PATCH', body: patch })
      toast('Saved')
      onSaved(item)
    } catch (failure) {
      const apiError = toApiError(failure)
      setIssues(apiError.issues)
      setFormError(apiError.message)
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open
      title={`Edit ${org.name}`}
      submitLabel="Save"
      busy={saving}
      error={formError}
      note={
        <button type="button" className={`${ui.dangerGhost} ${ui.small} ${styles.dialogDelete}`} onClick={onDelete} disabled={saving}>
          Delete org
        </button>
      }
      onSubmit={save}
      onClose={onClose}
    >
      <Field label="Name" error={issues.name}>
        {(control) => <input className={ui.input} value={draft.name} onChange={(event) => set('name', event.target.value)} maxLength={120} {...control} />}
      </Field>
      <div className={styles.pair}>
        <Field label="Kind" error={issues.kind}>
          {(control) => (
            <select className={ui.input} value={draft.kind} onChange={(event) => set('kind', event.target.value as OrgKind)} {...control}>
              {ORG_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind === 'hackathon' ? 'Hackathon organizer' : ORG_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Owner" error={issues.ownerEmail}>
          {(control) => <OwnerSelect value={draft.ownerEmail} team={team} onChange={(email) => set('ownerEmail', email)} {...control} />}
        </Field>
      </div>
      <Field label="Website" error={issues.website}>
        {(control) => <input className={ui.input} value={draft.website} onChange={(event) => set('website', event.target.value)} maxLength={300} {...control} />}
      </Field>
      <Field label="Focus" error={issues.focus}>
        {(control) => <input className={ui.input} value={draft.focus} onChange={(event) => set('focus', event.target.value)} maxLength={160} {...control} />}
      </Field>
      <Field label="Notes" error={issues.notes}>
        {(control) => <textarea className={ui.input} value={draft.notes} onChange={(event) => set('notes', event.target.value)} maxLength={4000} rows={3} {...control} />}
      </Field>
    </FormDialog>
  )
}

// ---- The logo wall: Partnerships' call, so it's locked for everyone else -----------------------

const WALL_CHOICES: { id: Exclude<Wall, ''>; label: string }[] = [
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'partners', label: 'Partners' },
]

function LogoWallPanel({ org, onSaved }: { org: OrgDetail; onSaved: (org: OrgDetail) => void }) {
  const toast = useToast()
  const gated = useGated()
  const allowed = useCan()('partnerships')
  const locked = gated('partnerships')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState(String(org.wallOrder))
  const [wasOrder, setWasOrder] = useState(org.wallOrder)
  const file = useRef<HTMLInputElement>(null)

  // Follow a saved order (this panel's or a teammate's) unless they're mid-edit.
  if (org.wallOrder !== wasOrder) {
    setWasOrder(org.wallOrder)
    setOrder(String(org.wallOrder))
  }

  const patch = async (changes: OrgPatch, done: string) => {
    setBusy(true)
    try {
      const { item } = await api<{ item: OrgDetail }>(`/admin/orgs/${org.id}`, { method: 'PATCH', body: changes })
      onSaved(item)
      toast(done)
    } catch (failure) {
      toast({ text: 'Couldn’t change the logo wall', detail: toApiError(failure).message, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const saveOrder = () => {
    const value = Number(order)
    if (!Number.isInteger(value) || value < 0 || value > 999) {
      setOrder(String(org.wallOrder))
      return
    }
    if (value !== org.wallOrder) void patch({ wallOrder: value }, 'Order saved')
  }

  const upload = async (picked: File | undefined) => {
    if (!picked) return
    setBusy(true)
    try {
      const url = await uploadPicture(picked)
      await patch({ logo: url.replace(/^\/api\/uploads\//, '') }, 'Logo saved')
    } catch (failure) {
      toast({ text: 'Couldn’t upload that logo', detail: failure instanceof Error ? failure.message : String(failure), tone: 'error' })
      setBusy(false)
    }
  }

  const on = org.wall !== ''
  const disabled = busy || !allowed

  return (
    <section className={ui.panelFlush} aria-labelledby="wall-title">
      <div className={ui.flushHead}>
        <h2 id="wall-title" className={ui.panelTitle}>
          Logo wall
        </h2>
      </div>
      <div className={styles.panelBody}>
        <label className={ui.switchRow} title={locked.title}>
          <input
            type="checkbox"
            role="switch"
            className={ui.switch}
            checked={on}
            disabled={disabled}
            aria-disabled={locked['aria-disabled']}
            onChange={(event) => void patch({ wall: event.target.checked ? 'sponsors' : '' }, event.target.checked ? 'On the logo wall' : 'Off the logo wall')}
          />
          <span className={ui.switchText}>
            <span className={ui.switchLabel}>On the logo wall</span>
            <span className={ui.hint}>
              {on ? `Shows under ${org.wall === 'sponsors' ? 'Sponsors' : 'Partners'} on Track record.` : 'Put a logo up once they’ve said yes.'}
            </span>
          </span>
        </label>

        {on && (
          <div className={styles.logoRow}>
            <SegmentGroup label="Which wall">
              {WALL_CHOICES.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={ui.tab}
                  aria-pressed={org.wall === choice.id}
                  onClick={() => org.wall !== choice.id && void patch({ wall: choice.id }, `Moved to ${choice.label}`)}
                  {...locked}
                  disabled={disabled}
                >
                  {choice.label}
                </button>
              ))}
            </SegmentGroup>
            <label className={ui.field}>
              <span className={ui.srOnly}>Order on the wall</span>
              <input
                className={`${ui.input} ${styles.order}`}
                type="number"
                min={0}
                max={999}
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                onBlur={saveOrder}
                onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), saveOrder())}
                disabled={disabled}
                title={locked.title ?? 'Lower comes first'}
                aria-label="Order on the wall (lower comes first)"
              />
            </label>
          </div>
        )}

        <div className={styles.logoRow}>
          {org.logo && (
            <span className={styles.logo}>
              <img src={`/api/uploads/${org.logo}`} alt={`${org.name} logo`} />
            </span>
          )}
          <input ref={file} type="file" accept={UPLOAD_ACCEPT} hidden onChange={(event) => void upload(event.target.files?.[0])} />
          <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => file.current?.click()} {...locked} disabled={disabled}>
            <UploadIcon /> {org.logo ? 'Replace logo' : 'Upload logo'}
          </button>
          {org.logo && (
            <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => void patch({ logo: null }, 'Logo removed')} {...locked} disabled={disabled}>
              Remove
            </button>
          )}
        </div>
        {!allowed && <p className={ui.hint}>{whoCanChange('partnerships')}</p>}
      </div>
    </section>
  )
}
