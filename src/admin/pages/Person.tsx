import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Member, MemberDetail } from '../../../shared/api'
import { TRACKS, YEARS } from '../../../shared/constants'
import { CONTACT_KINDS, PERSON_KIND_LABELS, type ContactKind, type PersonDetail, type PersonPatch } from '../../../shared/crm'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { LogInteraction } from '../components/LogInteraction'
import { MakeIntro } from '../components/MakeIntro'
import { PlusIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useSaveShortcut } from '../lib/keys'
import { useToast } from '../lib/toast'
import styles from './crm/crm.module.css'
import { formatAt, initials, isoOf, KIND_TONE } from './crm/format'
import { NewOrg } from './crm/NewOrg'
import { FollowUpsPanel, IntrosPanel, TimelinePanel } from './crm/panels'
import { NEW_ORG, useOrgList, useTeam } from './crm/data'
import { OrgSelect, OwnerSelect } from './crm/pickers'
import { SetFollowUp } from './crm/SetFollowUp'
import { ConfirmDialog } from './people/ConfirmDialog'
import { toApiError, useApi } from './people/useApi'

// One person: a member (m12) or a contact (c4). A contact who is really a member (same email)
// opens as the member, with the contact's history folded into the timeline.

export function Component() {
  const { key = '' } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi<{ item: PersonDetail }>(`/admin/people/${encodeURIComponent(key)}`)
  const person = data?.item

  // c7 might be member 3 in disguise: move to the member's own address.
  useEffect(() => {
    if (person && !loading && person.key !== key && person.type === 'member' && /^c/.test(key)) {
      navigate(`/admin/people/${person.key}`, { replace: true })
    }
  }, [person, loading, key, navigate])

  if (!person || person.key !== key) {
    return (
      <div className={ui.page}>
        <PageHeader title={loading || person ? 'Person' : 'Not found'} back={{ to: '/admin/people', label: 'People' }} />
        {loading || person ? (
          <div className={ui.panel} aria-hidden="true">
            <span className={ui.skeleton} style={{ width: 180, marginBottom: 14 }} />
            <span className={ui.skeleton} style={{ width: 260 }} />
          </div>
        ) : (
          <p className={ui.error} role="alert">
            {error?.status === 404 ? 'That person isn’t in People, or was deleted.' : error?.message}
          </p>
        )}
      </div>
    )
  }
  return <Detail person={person} reload={reload} />
}

function Detail({ person, reload }: { person: PersonDetail; reload: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const isMember = person.type === 'member'
  const memberApi = useApi<MemberDetail>(isMember ? `/admin/members/${person.id}` : null)
  const member = isMember ? memberApi.data : undefined
  const [dialog, setDialog] = useState<'follow-up' | 'intro' | 'log' | 'delete' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const first = person.name.split(/\s+/)[0]
  const reloadMember = memberApi.reload
  const refresh = useCallback(() => {
    reload()
    reloadMember()
  }, [reload, reloadMember])

  const remove = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api(isMember ? `/admin/members/${person.id}` : `/admin/people/${person.key}`, { method: 'DELETE' })
      toast(`${person.name} deleted`)
      navigate('/admin/people', { replace: true })
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
      setDeleting(false)
    }
  }

  // An intro goes from a student (a member or a lead) to a contact.
  const isStudent = person.kind === 'member' || person.kind === 'lead'
  const rsvps = member?.rsvps ?? []
  const fund = member?.fundInterest ?? []

  return (
    <div className={ui.page}>
      <PageHeader
        title={person.name}
        tabTitle={`${person.name} · People`}
        back={{ to: '/admin/people', label: 'People' }}
        actions={
          <>
            <button type="button" className={ui.button} onClick={() => setDialog('follow-up')}>
              Set follow-up
            </button>
            <button type="button" className={ui.button} onClick={() => setDialog('intro')}>
              Make intro
            </button>
            <button type="button" className={ui.primary} onClick={() => setDialog('log')}>
              <PlusIcon /> Log interaction
            </button>
          </>
        }
      />

      <div className={styles.split}>
        <div className={styles.column}>
          <section className={`${ui.panel} ${styles.who}`} aria-label="Who">
            <span className={styles.bigAvatar} aria-hidden="true">
              {initials(person.name)}
            </span>
            <div className={styles.whoText}>
              <div className={styles.whoName}>
                <h2>{person.name}</h2>
                <span className={ui.state} data-tone={KIND_TONE[person.kind]}>
                  {PERSON_KIND_LABELS[person.kind]}
                </span>
              </div>
              <p className={styles.meta}>
                {person.orgName && person.orgId !== null ? (
                  <>
                    {person.title ? `${person.title} at ` : ''}
                    <Link to={`/admin/orgs/${person.orgId}`} className={ui.link}>
                      {person.orgName}
                    </Link>
                    {' · '}
                  </>
                ) : isMember ? (
                  `${[person.year, person.track].filter(Boolean).join(' · ')} · `
                ) : person.title ? (
                  `${person.title} · `
                ) : null}
                <a href={`mailto:${person.email}`}>{person.email}</a>
                {person.unsubscribed && <span className={ui.flagSample}> · Unsubscribed from list email</span>}
              </p>
            </div>
            {isMember && (
              <dl className={styles.stats}>
                <div>
                  <dt>{rsvps.length === 1 ? 'event' : 'events'}</dt>
                  <dd>{member ? rsvps.length : '·'}</dd>
                </div>
                <div>
                  <dt>{fund.length === 1 ? 'fund request' : 'fund requests'}</dt>
                  <dd>{member ? fund.length : '·'}</dd>
                </div>
                <div>
                  <dt>{person.intros.length === 1 ? 'intro' : 'intros'}</dt>
                  <dd>{person.intros.length}</dd>
                </div>
              </dl>
            )}
          </section>

          <TimelinePanel items={person.timeline} />
        </div>

        <div className={styles.column}>
          <FollowUpsPanel
            items={person.followUps}
            onChanged={reload}
            action={
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setDialog('follow-up')}>
                Set follow-up
              </button>
            }
          />

          <DetailsPanel
            // Fresh fields whenever what's saved changes (a save here, or a teammate's).
            key={JSON.stringify(draftOf(person, member?.member))}
            person={person}
            member={member?.member}
            onSaved={refresh}
          />

          <IntrosPanel
            items={person.intros}
            selfKey={person.key}
            action={
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setDialog('intro')}>
                Make intro
              </button>
            }
          />

          {isMember && (
            <>
              <section className={ui.panelFlush} aria-labelledby="rsvps-title">
                <div className={ui.flushHead}>
                  <h2 id="rsvps-title" className={ui.panelTitle}>
                    RSVPs <span className={ui.count}>{rsvps.length}</span>
                  </h2>
                </div>
                {rsvps.length === 0 ? (
                  <p className={styles.none}>{member ? 'No RSVPs with this email.' : 'Loading…'}</p>
                ) : (
                  <ul className={styles.list}>
                    {[...rsvps]
                      .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
                      .map((rsvp) => (
                        <li key={rsvp.id}>
                          <div className={styles.grow}>
                            <Link to={`/admin/events/${rsvp.eventId}`} className={styles.t1}>
                              {rsvp.eventTitle}
                            </Link>
                          </div>
                          <time className={styles.end} dateTime={rsvp.eventDate}>
                            {formatAt(rsvp.eventDate)}
                          </time>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              <section className={ui.panelFlush} aria-labelledby="fund-title">
                <div className={ui.flushHead}>
                  <h2 id="fund-title" className={`${ui.panelTitle} ${ui.flushStatus}`}>
                    Fund requests <span className={ui.count}>{fund.length}</span>
                  </h2>
                  {fund.length > 0 && (
                    <Link to="/admin/fund" className={`${ui.ghost} ${ui.small}`}>
                      Open Fund
                    </Link>
                  )}
                </div>
                {fund.length === 0 ? (
                  <p className={styles.none}>{member ? 'No fund requests.' : 'Loading…'}</p>
                ) : (
                  <ul className={styles.list}>
                    {fund.map((entry) => (
                      <li key={entry.id}>
                        <div className={styles.grow}>
                          <span className={styles.t1}>
                            {entry.target} · {entry.amount}
                          </span>
                          <span className={styles.t2}>{entry.spend}</span>
                        </div>
                        <span className={styles.end}>
                          <span className={ui.state} data-tone={entry.status === 'approved' ? 'live' : entry.status === 'new' ? 'filled' : entry.status === 'reviewing' ? 'sample' : undefined}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                          <br />
                          <time dateTime={isoOf(entry.createdAt)}>{formatAt(entry.createdAt)}</time>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          <button type="button" className={`${ui.dangerGhost} ${styles.danger}`} onClick={() => setDialog('delete')}>
            <TrashIcon /> {isMember ? 'Delete member' : 'Delete person'}
          </button>
        </div>
      </div>

      <SetFollowUp
        open={dialog === 'follow-up'}
        personKey={person.key}
        ownerEmail={person.ownerEmail}
        about={first}
        onClose={() => setDialog(null)}
        onSaved={() => {
          setDialog(null)
          reload()
        }}
      />
      <MakeIntro
        open={dialog === 'intro'}
        studentKey={isStudent ? person.key : null}
        contactKey={isStudent ? null : person.key}
        onClose={() => setDialog(null)}
        onMade={() => {
          setDialog(null)
          reload()
        }}
      />
      <LogInteraction
        open={dialog === 'log'}
        personKey={person.key}
        orgId={person.orgId}
        onClose={() => setDialog(null)}
        onLogged={() => {
          setDialog(null)
          reload()
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title={`Delete ${person.name}?`}
        confirmLabel={isMember ? 'Delete member' : 'Delete person'}
        danger
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setDialog(null)
          setDeleteError('')
        }}
      >
        {isMember ? (
          <p>This removes {person.email} from the member list for good, along with their RSVPs, fund requests and applications. It can’t be undone.</p>
        ) : (
          <p>
            This removes {person.name} from People, with their interactions, follow-ups and intros. Asks and deals with them stay. It can’t be
            undone.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

// ---- Details: what a teammate can change about them --------------------------------------------

interface Draft {
  name: string
  notes: string
  ownerEmail: string
  kind: ContactKind
  orgId: number | null
  title: string
  link: string
  year: string
  track: string
  unsubscribed: boolean
}

function draftOf(person: PersonDetail, member: Member | undefined): Draft {
  return {
    name: person.name,
    notes: person.notes,
    ownerEmail: person.ownerEmail ?? '',
    kind: person.kind === 'member' ? 'contact' : person.kind,
    orgId: person.orgId,
    title: person.title,
    link: person.link,
    year: member?.year ?? person.year ?? '',
    track: member?.track ?? person.track ?? '',
    unsubscribed: member?.unsubscribed ?? person.unsubscribed ?? false,
  }
}

// Members keep the endpoints their old page used for year, track and email; the rest goes
// through People. Contacts go through People alone.
const MEMBER_FIELDS = ['year', 'track', 'unsubscribed'] as const
const MEMBER_PEOPLE_FIELDS = ['name', 'notes', 'ownerEmail'] as const
const CONTACT_FIELDS = ['name', 'notes', 'ownerEmail', 'kind', 'orgId', 'title', 'link'] as const

function DetailsPanel({ person, member, onSaved }: { person: PersonDetail; member: Member | undefined; onSaved: () => void }) {
  const toast = useToast()
  const team = useTeam()
  const isMember = person.type === 'member'
  const { orgs, setData: setOrgs } = useOrgList(!isMember)
  const form = useRef<HTMLFormElement>(null)
  const saved = draftOf(person, member)
  const [draft, setDraft] = useState(saved)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [makingOrg, setMakingOrg] = useState(false)

  const changed = (Object.keys(draft) as (keyof Draft)[]).filter((field) => draft[field] !== saved[field])
  const dirty = changed.length > 0
  const set = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [field]: value }))
  const pick = (fields: readonly (keyof Draft)[]) =>
    Object.fromEntries(fields.filter((field) => changed.includes(field)).map((field) => [field, draft[field]]))

  const save = async (event?: FormEvent) => {
    event?.preventDefault()
    if (saving || !dirty) return
    setSaving(true)
    setFormError('')
    setIssues({})
    try {
      if (isMember) {
        const memberPatch = pick(MEMBER_FIELDS)
        const peoplePatch = pick(MEMBER_PEOPLE_FIELDS) as PersonPatch
        if (Object.keys(memberPatch).length > 0) await api(`/admin/members/${person.id}`, { method: 'PATCH', body: memberPatch })
        if (Object.keys(peoplePatch).length > 0) await api(`/admin/people/${person.key}`, { method: 'PATCH', body: peoplePatch })
      } else {
        await api(`/admin/people/${person.key}`, { method: 'PATCH', body: pick(CONTACT_FIELDS) as PersonPatch })
      }
      toast('Saved')
      onSaved()
    } catch (failure) {
      const apiError = toApiError(failure)
      setIssues(apiError.issues)
      setFormError(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const submit = useCallback(() => form.current?.requestSubmit(), [])
  useSaveShortcut(submit, dirty && !saving)

  return (
    <section className={ui.panelFlush} aria-labelledby="details-title">
      <div className={ui.flushHead}>
        <h2 id="details-title" className={ui.panelTitle}>
          Details
        </h2>
      </div>
      <form ref={form} className={styles.panelBody} onSubmit={save} noValidate>
        <Field label="Name" error={issues.name}>
          {(control) => <input className={ui.input} value={draft.name} onChange={(event) => set('name', event.target.value)} maxLength={isMember ? 80 : 120} {...control} />}
        </Field>
        <Field label="Owner" error={issues.ownerEmail}>
          {(control) => <OwnerSelect value={draft.ownerEmail} team={team} onChange={(email) => set('ownerEmail', email)} {...control} />}
        </Field>

        {isMember ? (
          <>
            <div className={styles.pair}>
              <Field label="Year" error={issues.year}>
                {(control) => (
                  <select className={ui.input} value={draft.year} onChange={(event) => set('year', event.target.value)} {...control}>
                    {/* An old value stays selectable if it predates the current list. */}
                    {!(YEARS as readonly string[]).includes(draft.year) && <option value={draft.year}>{draft.year}</option>}
                    {YEARS.map((year) => (
                      <option key={year}>{year}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Track" error={issues.track}>
                {(control) => (
                  <select className={ui.input} value={draft.track} onChange={(event) => set('track', event.target.value)} {...control}>
                    {!(TRACKS as readonly string[]).includes(draft.track) && <option value={draft.track}>{draft.track}</option>}
                    {TRACKS.map((track) => (
                      <option key={track}>{track}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <label className={ui.switchRow}>
              <input
                type="checkbox"
                role="switch"
                className={ui.switch}
                checked={draft.unsubscribed}
                onChange={(event) => set('unsubscribed', event.target.checked)}
                disabled={!member}
              />
              <span className={ui.switchText}>
                <span className={ui.switchLabel}>Unsubscribed from list email</span>
                <span className={ui.hint}>Event RSVP and fund emails still reach them.</span>
              </span>
            </label>
          </>
        ) : (
          <>
            <Field label="Kind" error={issues.kind}>
              {(control) => (
                <select className={ui.input} value={draft.kind} onChange={(event) => set('kind', event.target.value as ContactKind)} {...control}>
                  {CONTACT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {PERSON_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className={styles.pair}>
              <Field label="Org" error={issues.orgId}>
                {(control) => (
                  <OrgSelect value={draft.orgId} orgs={orgs} onChange={(next) => (next === NEW_ORG ? setMakingOrg(true) : set('orgId', next))} {...control} />
                )}
              </Field>
              <Field label={draft.kind === 'lead' ? 'Year or school' : 'Title'} error={issues.title}>
                {(control) => <input className={ui.input} value={draft.title} onChange={(event) => set('title', event.target.value)} maxLength={120} {...control} />}
              </Field>
            </div>
            <Field label="Link" error={issues.link}>
              {(control) => (
                <input
                  className={ui.input}
                  type="url"
                  value={draft.link}
                  onChange={(event) => set('link', event.target.value)}
                  placeholder="https://linkedin.com/in/…"
                  maxLength={300}
                  {...control}
                />
              )}
            </Field>
            {draft.link && /^https?:\/\//.test(draft.link) && (
              <a href={draft.link} target="_blank" rel="noreferrer" className={`${ui.hint} ${ui.link}`} style={{ justifySelf: 'start' }}>
                Open link
              </a>
            )}
          </>
        )}

        <Field label="Notes" hint={isMember ? 'Only the team sees these.' : 'Only the team sees these. Claude reads them when it drafts an ask.'} error={issues.notes}>
          {(control) => (
            <textarea className={ui.input} value={draft.notes} onChange={(event) => set('notes', event.target.value)} maxLength={isMember ? 2000 : 4000} rows={4} {...control} />
          )}
        </Field>

        <p className={ui.error} role="alert" hidden={!formError}>
          {formError}
        </p>
      </form>
      <div className={styles.panelFoot}>
        <span className={styles.saveState} role="status">
          {saving ? 'Saving…' : dirty ? 'Unsaved changes' : ''}
        </span>
        {dirty && !saving && (
          <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setDraft(saved)}>
            Discard
          </button>
        )}
        <button type="button" className={`${ui.primary} ${ui.small}`} onClick={() => save()} disabled={!dirty || saving}>
          Save
        </button>
      </div>

      <NewOrg
        open={makingOrg}
        onClose={() => setMakingOrg(false)}
        onCreated={(org) => {
          setOrgs((prev) => ({ items: [...(prev?.items ?? []), org].sort((a, b) => a.name.localeCompare(b.name)) }))
          set('orgId', org.id)
          setMakingOrg(false)
        }}
      />
    </section>
  )
}
