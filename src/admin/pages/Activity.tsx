import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import {
  INTERACTION_KIND_LABELS,
  INTRO_STATUSES,
  INTRO_STATUS_LABELS,
  type FollowUp,
  type Interaction,
  type Intro,
  type IntroStatus,
  type PersonLink,
} from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import ui from '../admin.module.css'
import { EmptyState } from '../components/bits'
import { Field } from '../components/Field'
import { FormDialog, Segmented } from '../components/FormDialog'
import dialog from '../components/FormDialog.module.css'
import { PlusIcon } from '../components/icons'
import { LogInteraction } from '../components/LogInteraction'
import { MakeIntro } from '../components/MakeIntro'
import { PageHeader } from '../components/PageHeader'
import { PersonPicker, type PickedPerson } from '../components/PersonPicker'
import { addDays, bostonToday, dueLabel, formatDay, formatPastDay, initials, stampDay, useOwners } from '../lib/activity'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import { useApi } from './people/useApi'
import styles from './Activity.module.css'

type Tab = 'log' | 'follow-ups' | 'intros'

const INTRO_TONES: Record<IntroStatus, string | undefined> = { drafting: 'sample', sent: 'filled', met: 'live', hired_or_funded: 'live', passed: 'draft' }

/** Who a row is with: the person (to their page), else the org. */
function With({ person, orgId, orgName }: { person: PersonLink | null; orgId: number | null; orgName: string | null }) {
  if (person) {
    return (
      <span className={styles.with}>
        <Link to={`/admin/people/${person.key}`} className={styles.link}>
          {person.name}
        </Link>
        {person.orgName && <span className={ui.dim}>{person.orgName}</span>}
      </span>
    )
  }
  if (orgId !== null && orgName) {
    return (
      <Link to={`/admin/orgs/${orgId}`} className={styles.link}>
        {orgName}
      </Link>
    )
  }
  return <span className={ui.dim}>No one</span>
}

function Owner({ email, label }: { email: string; label: string }) {
  return (
    <span className={ui.avatar} title={label}>
      {initials(email)}
    </span>
  )
}

/** Activity: what's been logged, what's owed, and the intros we've made. The path picks the tab. */
export function Component() {
  const { pathname } = useLocation()
  const tab: Tab = pathname.endsWith('/follow-ups') ? 'follow-ups' : pathname.endsWith('/intros') ? 'intros' : 'log'
  const [logging, setLogging] = useState(false)
  const [introducing, setIntroducing] = useState(false)
  const [params, setParams] = useSearchParams()
  const creatingFollowUp = params.get('new') === '1' && tab === 'follow-ups'
  // Bumped after something's added from the bar, so the list under it loads again.
  const [version, setVersion] = useState(0)
  const bump = () => setVersion((value) => value + 1)

  const actions =
    tab === 'intros' ? (
      <button type="button" className={ui.primary} onClick={() => setIntroducing(true)}>
        <PlusIcon /> Make intro
      </button>
    ) : tab === 'follow-ups' ? (
      <>
        <button type="button" className={ui.button} onClick={() => setLogging(true)}>
          Log interaction
        </button>
        <button type="button" className={ui.primary} onClick={() => setParams({ new: '1' }, { replace: true })}>
          <PlusIcon /> New follow-up
        </button>
      </>
    ) : (
      <button type="button" className={ui.primary} onClick={() => setLogging(true)}>
        <PlusIcon /> Log interaction
      </button>
    )

  return (
    <div className={ui.page}>
      <PageHeader title="Activity" tabTitle={tab === 'log' ? 'Activity' : tab === 'intros' ? 'Intros' : 'Follow-ups'} actions={actions} />
      {tab === 'log' && <Log key={version} />}
      {tab === 'follow-ups' && <FollowUps key={version} />}
      {tab === 'intros' && <Intros key={version} />}

      <LogInteraction open={logging} onClose={() => setLogging(false)} onLogged={bump} />
      <MakeIntro open={introducing} onClose={() => setIntroducing(false)} onMade={bump} />
      <NewFollowUp
        open={creatingFollowUp}
        onClose={() => setParams({}, { replace: true })}
        onMade={() => {
          setParams({}, { replace: true })
          bump()
        }}
      />
    </div>
  )
}

// ---- Log ----------------------------------------------------------------------------------------

function Log() {
  const { data, error, loading } = useApi<{ items: Interaction[] }>('/admin/interactions')
  const { labelFor } = useOwners()
  const items = data?.items ?? []
  return (
    <>
      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>
      {!data && loading ? (
        <Skeleton />
      ) : data && items.length === 0 ? (
        <div className={ui.panel}>
          <EmptyState title="Nothing logged yet">
            <p>Calls, coffees and meetings with the people we work with land here, and on their pages.</p>
          </EmptyState>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Kind</th>
                <th scope="col">With</th>
                <th scope="col">What happened</th>
                <th scope="col">By</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={`${ui.dim} ${ui.nowrap}`}>{formatPastDay(item.happenedOn)}</td>
                  <td data-label="Kind">
                    <span className={ui.state} data-tone="filled">
                      {INTERACTION_KIND_LABELS[item.kind]}
                    </span>
                  </td>
                  <td data-label="With">
                    <With person={item.person} orgId={item.orgId} orgName={item.orgName} />
                  </td>
                  <td data-label="What" className={styles.summary}>
                    {item.summary ? <span className={styles.clamp}>{item.summary}</span> : <span className={ui.dim}>No notes</span>}
                    {item.dealId !== null && (
                      <Link to={`/admin/pipeline/${item.dealId}`} className={styles.dealLink}>
                        {item.dealTitle}
                      </Link>
                    )}
                  </td>
                  <td data-label="By">
                    <Owner email={item.createdBy} label={labelFor(item.createdBy)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  )
}

// ---- Follow-ups ---------------------------------------------------------------------------------

function FollowUps() {
  const toast = useToast()
  const guard = useAuthGuard()
  const { labelFor } = useOwners()
  const [params, setParams] = useSearchParams()
  const mine = params.get('mine') === '1'
  const showDone = params.get('done') === '1'
  const { data, error, loading, setData } = useApi<{ items: FollowUp[] }>(`/admin/follow-ups?${showDone ? '' : 'open=1&'}${mine ? 'mine=1' : ''}`)
  const items = data?.items ?? []
  const [busy, setBusy] = useState<number | null>(null)

  function setParam(key: string, value: string | null) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  async function tick(item: FollowUp) {
    setBusy(item.id)
    try {
      const { item: saved } = await api<{ item: FollowUp }>(`/admin/follow-ups/${item.id}`, { method: 'PATCH', body: { done: !item.doneAt } })
      // A ticked one stays in place (struck through) until the list reloads, so a slip is easy to undo.
      setData((current) => current && { items: current.items.map((row) => (row.id === saved.id ? saved : row)) })
      if (saved.doneAt) {
        toast({ text: 'Done', detail: saved.title, action: { label: 'Undo', onAction: () => void tick(saved) } })
      }
    } catch (failure) {
      if (guard(failure)) return
      toast({ text: 'Couldn’t change that follow-up', detail: messageFor(failure), tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className={ui.toolbar}>
        <Segmented
          label="Whose follow-ups"
          options={[
            { value: 'everyone', label: 'Everyone’s' },
            { value: 'mine', label: 'Mine' },
          ]}
          value={mine ? 'mine' : 'everyone'}
          onChange={(value) => setParam('mine', value === 'mine' ? '1' : null)}
        />
        <label className={styles.switchRow}>
          <input type="checkbox" className={ui.switch} checked={showDone} onChange={(event) => setParam('done', event.target.checked ? '1' : null)} />
          Show done
        </label>
      </div>
      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>
      {!data && loading ? (
        <Skeleton />
      ) : data && items.length === 0 ? (
        <div className={ui.panel}>
          <EmptyState title={mine ? 'Nothing on your list' : 'Nothing owed'}>
            <p>A next step from Log interaction, or New follow-up, shows up here by its due day.</p>
          </EmptyState>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.checkCol}>
                  <span className={ui.srOnly}>Done</span>
                </th>
                <th scope="col">Follow-up</th>
                <th scope="col">With</th>
                <th scope="col">Due</th>
                <th scope="col">Owner</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const due = item.doneAt ? null : dueLabel(item.dueOn)
                return (
                  <tr key={item.id} data-done={Boolean(item.doneAt) || undefined}>
                    <td className={styles.checkCol}>
                      <input
                        type="checkbox"
                        className={styles.check}
                        checked={Boolean(item.doneAt)}
                        disabled={busy === item.id}
                        onChange={() => tick(item)}
                        aria-label={`Done: ${item.title}`}
                      />
                    </td>
                    <td className={styles.followUp}>
                      <span className={styles.followUpTitle}>{item.title}</span>
                      {item.dealId !== null ? (
                        <Link to={`/admin/pipeline/${item.dealId}`} className={styles.sub}>
                          {item.dealTitle}
                        </Link>
                      ) : item.orgName && item.person ? (
                        <span className={styles.sub}>{item.orgName}</span>
                      ) : null}
                    </td>
                    <td data-label="With">
                      <With person={item.person} orgId={item.orgId} orgName={item.orgName} />
                    </td>
                    <td data-label="Due" className={ui.nowrap}>
                      {due ? (
                        <span className={styles.due} data-tone={due.tone}>
                          {due.text}
                        </span>
                      ) : (
                        <span className={ui.dim}>Done {item.doneAt ? formatDay(stampDay(item.doneAt)) : ''}</span>
                      )}
                    </td>
                    <td data-label="Owner">
                      <Owner email={item.ownerEmail} label={labelFor(item.ownerEmail)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  )
}

/** New follow-up: what, by when, whose, and optionally who it's with. */
function NewFollowUp({ open, onClose, onMade }: { open: boolean; onClose: () => void; onMade: () => void }) {
  // Mounted only while open, so each opening starts a fresh form.
  return open ? <NewFollowUpForm open onClose={onClose} onMade={onMade} /> : null
}

function NewFollowUpForm({ open, onClose, onMade }: { open: boolean; onClose: () => void; onMade: () => void }) {
  const toast = useToast()
  const guard = useAuthGuard()
  const { owners, me } = useOwners()
  const [title, setTitle] = useState('')
  const [person, setPerson] = useState<PickedPerson | null>(null)
  const [due, setDue] = useState(() => addDays(bostonToday(), 3))
  const [owner, setOwner] = useState(me)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!title.trim()) {
      setIssues({ title: 'Say what needs doing.' })
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const { item } = await api<{ item: FollowUp }>('/admin/follow-ups', {
        body: { title, dueOn: due, ownerEmail: owner, personKey: person?.key ?? null },
      })
      toast({ text: 'Follow-up added', detail: `Due ${formatDay(item.dueOn)}` })
      onMade()
    } catch (error) {
      if (guard(error)) return
      setIssues(error instanceof ApiError ? error.issues : {})
      setFailure(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog open={open} title="New follow-up" submitLabel="Add follow-up" busy={saving} error={failure} onSubmit={save} onClose={onClose}>
      <Field label="What needs doing" error={issues.title}>
        {(control) => (
          <input {...control} className={ui.input} placeholder="Send the recap and the deck" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
        )}
      </Field>
      <Field label="With" error={issues.personKey}>
        {(control) => <PersonPicker {...control} value={person} onChange={setPerson} placeholder="Search People (optional)" />}
      </Field>
      <div className={dialog.pair}>
        <Field label="Due" error={issues.dueOn}>
          {(control) => <input {...control} type="date" className={ui.input} value={due} onChange={(event) => setDue(event.target.value)} />}
        </Field>
        <Field label="Owner" error={issues.ownerEmail}>
          {(control) => (
            <select {...control} className={ui.input} value={owner} onChange={(event) => setOwner(event.target.value)}>
              {owners.map((option) => (
                <option key={option.email} value={option.email}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </FormDialog>
  )
}

// ---- Intros -------------------------------------------------------------------------------------

function Intros() {
  const toast = useToast()
  const guard = useAuthGuard()
  const { labelFor } = useOwners()
  const { data, error, loading, setData } = useApi<{ items: Intro[] }>('/admin/intros')
  const items = data?.items ?? []

  async function setStatus(intro: Intro, status: IntroStatus) {
    const before = intro.status
    setData((current) => current && { items: current.items.map((row) => (row.id === intro.id ? { ...row, status } : row)) })
    try {
      await api(`/admin/intros/${intro.id}`, { method: 'PATCH', body: { status } })
      toast(`${intro.student.name} to ${intro.contact.name}: ${INTRO_STATUS_LABELS[status]}`)
    } catch (failure) {
      setData((current) => current && { items: current.items.map((row) => (row.id === intro.id ? { ...row, status: before } : row)) })
      if (guard(failure)) return
      toast({ text: 'Couldn’t change that intro', detail: messageFor(failure), tone: 'error' })
    }
  }

  return (
    <>
      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>
      {!data && loading ? (
        <Skeleton />
      ) : data && items.length === 0 ? (
        <div className={ui.panel}>
          <EmptyState title="No intros yet">
            <p>When we connect a student with a VC, recruiter or founder, log it here to see where it went.</p>
          </EmptyState>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Introduced to</th>
                <th scope="col">Org</th>
                <th scope="col">Why</th>
                <th scope="col">Status</th>
                <th scope="col">By</th>
                <th scope="col">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((intro) => (
                <tr key={intro.id}>
                  <td>
                    {intro.student.key ? (
                      <Link to={`/admin/people/${intro.student.key}`} className={ui.rowTitle}>
                        {intro.student.name}
                      </Link>
                    ) : (
                      <span className={ui.dim}>{intro.student.name}</span>
                    )}
                  </td>
                  <td data-label="To">
                    <Link to={`/admin/people/${intro.contact.key}`} className={styles.link}>
                      {intro.contact.name}
                    </Link>
                  </td>
                  <td data-label="Org" className={ui.soft}>
                    {intro.contact.orgName ?? <span className={ui.dim}>None</span>}
                  </td>
                  <td data-label="Why" className={ui.dim}>
                    {intro.reason || 'No reason given'}
                  </td>
                  <td data-label="Status">
                    <label className={styles.statusPick} data-tone={INTRO_TONES[intro.status]}>
                      <span className={ui.srOnly}>Status of {intro.student.name} to {intro.contact.name}</span>
                      <select value={intro.status} onChange={(event) => setStatus(intro, event.target.value as IntroStatus)}>
                        {INTRO_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {INTRO_STATUS_LABELS[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td data-label="By">
                    <Owner email={intro.madeBy} label={labelFor(intro.madeBy)} />
                  </td>
                  <td data-label="When" className={`${ui.dim} ${ui.nowrap}`}>
                    {formatPastDay(stampDay(intro.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  )
}

function Skeleton() {
  return (
    <div className={ui.panel} aria-hidden="true">
      <span className={ui.skeleton} style={{ width: 160, marginBottom: 14 }} />
      <span className={ui.skeleton} style={{ width: 320 }} />
    </div>
  )
}
