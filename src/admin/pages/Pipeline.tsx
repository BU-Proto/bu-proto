import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  type Deal,
  type DealDetail,
  type DealStage,
  type DealType,
  type Org,
} from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { FormDialog, Segmented } from '../components/FormDialog'
import dialog from '../components/FormDialog.module.css'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { PersonPicker, type PickedPerson } from '../components/PersonPicker'
import { useCan, useGated } from '../lib/access'
import { DEAL_TYPE_TONES, dueLabel, formatCents, formatDay, initials, landsBefore, parseDollars, useOfferSponsorWall, useOwners } from '../lib/activity'
import { boardDrag } from '../lib/boardDrag'
import { formatRelative, plural } from '../lib/format'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import { useApi } from './people/useApi'
import styles from './Pipeline.module.css'

const TYPE_FILTERS: { value: DealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sponsor', label: 'Sponsorships' },
  { value: 'partner', label: 'Partnerships' },
  { value: 'visit', label: 'Speakers and visits' },
]

const isType = (value: string | null): value is DealType => (DEAL_TYPES as readonly string[]).includes(value ?? '')
const isStage = (value: string): value is DealStage => (DEAL_STAGES as readonly string[]).includes(value)
const dueOf = (deal: Deal) => deal.nextFollowUp?.dueOn ?? null

export function Component() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const guard = useAuthGuard()
  const gated = useGated()('partnerships')
  const { labelFor } = useOwners()
  const offerWall = useOfferSponsorWall()

  const rawType = params.get('type')
  const type = isType(rawType) ? rawType : null
  const mine = params.get('mine') === '1'
  const showPassed = params.get('passed') === '1'
  const creating = params.get('new') === '1'

  const filters = `${type ? `&type=${type}` : ''}${mine ? '&mine=1' : ''}`
  const { data, error, loading, setData, reload } = useApi<{ items: Deal[] }>(`/admin/deals?${filters.slice(1)}`)
  const passed = useApi<{ items: Deal[] }>(`/admin/deals?passed=1${filters}`)
  const deals = data?.items ?? []
  const open = deals.filter((deal) => deal.stage !== 'delivered').length

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

  async function move(deal: Deal, stage: DealStage) {
    // Moves on the board at once, to where the board's order puts it; put back if the save fails.
    const moved = { ...deal, stage }
    setData((current) => {
      if (!current) return current
      const rest = current.items.filter((item) => item.id !== deal.id)
      const at = rest.findIndex((item) => item.stage === stage && landsBefore(dueOf(moved), dueOf(item)))
      return { items: at === -1 ? [...rest, moved] : [...rest.slice(0, at), moved, ...rest.slice(at)] }
    })
    try {
      await api<{ item: DealDetail }>(`/admin/deals/${deal.id}`, { method: 'PATCH', body: { stage } })
      toast(`Moved to ${DEAL_STAGE_LABELS[stage]}`)
      if (stage === 'committed') void offerWall(deal)
    } catch (failure) {
      if (guard(failure)) return
      toast({ text: 'Couldn’t move that deal', detail: messageFor(failure), tone: 'error' })
      reload()
    }
  }

  // Cards drag between columns (lib/boardDrag.ts). The drop lands in the data before the next
  // paint, so the card is in its new column the moment the lifted copy is gone.
  const boardRef = useRef<HTMLDivElement>(null)
  const canMove = !gated.disabled
  const onDrop = useEffectEvent((card: HTMLElement, lane: string) => {
    const deal = deals.find((item) => item.id === Number(card.dataset.card))
    if (deal && isStage(lane)) flushSync(() => void move(deal, lane))
  })
  useEffect(() => {
    const board = boardRef.current
    if (!board || !canMove) return
    return boardDrag(board, {
      ghostClass: styles.ghost,
      slotClass: styles.slot,
      landing: (card, cards) => cards.find((other) => landsBefore(card.dataset.due || null, other.dataset.due || null)) ?? null,
      onDrop,
    })
  }, [canMove])

  async function reopen(deal: Deal) {
    try {
      await api(`/admin/deals/${deal.id}`, { method: 'PATCH', body: { passed: false } })
      toast(`${deal.title} is back on the board`)
      reload()
      passed.reload()
    } catch (failure) {
      if (guard(failure)) return
      toast({ text: 'Couldn’t reopen that deal', detail: messageFor(failure), tone: 'error' })
    }
  }

  const passedCount = passed.data?.items.length ?? 0

  return (
    <div className={ui.page}>
      <PageHeader
        title="Pipeline"
        count={data ? `${open} open` : undefined}
        actions={
          <button type="button" className={ui.primary} onClick={() => setParam('new', '1')} {...gated}>
            <PlusIcon /> New deal
          </button>
        }
      />

      <div className={ui.toolbar}>
        <Segmented label="Type" options={TYPE_FILTERS} value={type ?? 'all'} onChange={(value) => setParam('type', value === 'all' ? null : value)} />
        <Segmented
          label="Whose deals"
          options={[
            { value: 'everyone', label: 'Everyone’s' },
            { value: 'mine', label: 'Mine' },
          ]}
          value={mine ? 'mine' : 'everyone'}
          onChange={(value) => setParam('mine', value === 'mine' ? '1' : null)}
        />
      </div>

      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <div className={styles.scroll} aria-busy={!data && loading}>
        <div ref={boardRef} className={styles.board} data-draggable={canMove || undefined}>
          {DEAL_STAGES.map((stage) => {
            const cards = deals.filter((deal) => deal.stage === stage)
            return (
              <section key={stage} className={styles.lane} aria-labelledby={`lane-${stage}`} data-lane={stage}>
                <div className={styles.laneHead}>
                  <h2 id={`lane-${stage}`}>{DEAL_STAGE_LABELS[stage]}</h2>
                  <span className={ui.count}>{data ? cards.length : ''}</span>
                </div>
                {!data && loading ? (
                  <span className={ui.skeleton} style={{ width: '70%', margin: '6px 4px' }} aria-hidden="true" />
                ) : cards.length === 0 ? (
                  <p className={styles.laneEmpty}>Nothing here</p>
                ) : (
                  cards.map((deal) => (
                    <DealCard key={deal.id} deal={deal} ownerLabel={labelFor(deal.ownerEmail)} />
                  ))
                )}
              </section>
            )
          })}
        </div>
      </div>

      {data && deals.length === 0 && !type && !mine && (
        <p className={styles.note}>No deals yet. Add the sponsors, partners and speakers you’re after with New deal.</p>
      )}

      {passedCount > 0 && (
        <div className={styles.passed}>
          <p className={styles.note}>
            {plural(passedCount, 'passed deal')} hidden.{' '}
            <button type="button" className={ui.link} onClick={() => setParam('passed', showPassed ? null : '1')} aria-expanded={showPassed}>
              {showPassed ? 'Hide them' : 'Show them'}
            </button>
          </p>
          {showPassed && passed.data && (
            <div className={ui.panelFlush}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col">Deal</th>
                    <th scope="col">Org</th>
                    <th scope="col">Was at</th>
                    <th scope="col">Passed</th>
                    <th scope="col" className={ui.rowActions}>
                      <span className={ui.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {passed.data.items.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <Link to={`/admin/pipeline/${deal.id}`} className={ui.rowTitle}>
                          {deal.title}
                        </Link>
                      </td>
                      <td data-label="Org" className={ui.soft}>
                        {deal.orgName}
                      </td>
                      <td data-label="Was at" className={ui.soft}>
                        {DEAL_STAGE_LABELS[deal.stage]}
                      </td>
                      <td data-label="Passed" className={`${ui.dim} ${ui.nowrap}`}>
                        {formatRelative(deal.passedAt)}
                      </td>
                      <td className={ui.rowActions}>
                        <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => reopen(deal)} {...gated}>
                          Reopen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <NewDeal
        open={creating}
        onClose={() => setParam('new', null)}
        // Straight to the new deal's page; leaving the board drops ?new=1 with it.
        onMade={(deal) => navigate(`/admin/pipeline/${deal.id}`)}
      />
    </div>
  )
}

function DealCard({ deal, ownerLabel }: { deal: Deal; ownerLabel: string }) {
  const due = deal.nextFollowUp ? dueLabel(deal.nextFollowUp.dueOn) : null
  const ask = deal.ask || (deal.amountCents !== null ? formatCents(deal.amountCents) : '')
  return (
    <article className={styles.card} data-card={deal.id} data-due={dueOf(deal) ?? undefined}>
      <div className={styles.cardTop}>
        <span className={ui.state} data-tone={DEAL_TYPE_TONES[deal.type]}>
          {DEAL_TYPE_LABELS[deal.type]}
        </span>
        <h3 className={styles.cardTitle}>
          <Link to={`/admin/pipeline/${deal.id}`}>{deal.title}</Link>
        </h3>
        <Link to={`/admin/orgs/${deal.orgId}`} className={styles.cardOrg}>
          {deal.orgName}
        </Link>
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.ask}>{ask}</span>
        <span className={styles.cardRight}>
          {due && deal.nextFollowUp && (
            <span className={styles.due} data-tone={due.tone} title={deal.nextFollowUp.title}>
              {due.tone === 'late' ? `${formatDay(deal.nextFollowUp.dueOn)} · late` : due.text}
            </span>
          )}
          {deal.ownerEmail && (
            <span className={`${ui.avatar} ${styles.owner}`} title={`Owner: ${ownerLabel}`}>
              {initials(deal.ownerEmail)}
            </span>
          )}
        </span>
      </div>
    </article>
  )
}

/** The New deal dialog: an org, who there, what kind, what we're asking for, and who owns it. */
function NewDeal({ open, onClose, onMade }: { open: boolean; onClose: () => void; onMade: (deal: DealDetail) => void }) {
  // Mounted only while open, so each opening starts a fresh form.
  return open ? <NewDealForm open onClose={onClose} onMade={onMade} /> : null
}

function NewDealForm({ open, onClose, onMade }: { open: boolean; onClose: () => void; onMade: (deal: DealDetail) => void }) {
  const toast = useToast()
  const guard = useAuthGuard()
  const can = useCan()
  const gated = useGated()('partnerships')
  const { owners, me } = useOwners()
  const orgs = useApi<{ items: Org[] }>(open ? '/admin/orgs' : null)
  const [orgId, setOrgId] = useState('')
  const [contact, setContact] = useState<PickedPerson | null>(null)
  const [type, setType] = useState<DealType>('sponsor')
  const [title, setTitle] = useState('')
  const [ask, setAsk] = useState('')
  const [amount, setAmount] = useState('')
  const [owner, setOwner] = useState(me)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)

  const orgList = [...(orgs.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  async function save() {
    const local: Record<string, string> = {}
    if (!orgId) local.orgId = 'Pick an org.'
    if (!title.trim()) local.title = 'Say what the deal is.'
    const amountCents = parseDollars(amount)
    if (amountCents === undefined) local.amountCents = 'Enter dollars, like 3000.'
    if (Object.keys(local).length) {
      setIssues(local)
      setFailure('')
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const { item } = await api<{ item: DealDetail }>('/admin/deals', {
        body: { orgId: Number(orgId), contactKey: contact?.key ?? null, type, title, ask, amountCents, ownerEmail: owner },
      })
      toast({ text: 'Deal added', detail: `${item.title} · ${item.orgName}` })
      onMade(item)
    } catch (error) {
      if (guard(error)) return
      setIssues(error instanceof ApiError ? error.issues : {})
      setFailure(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      title="New deal"
      submitLabel="Add deal"
      busy={saving}
      error={failure}
      gated={gated}
      note={can('partnerships') ? 'Starts at Identified.' : gated.title}
      onSubmit={save}
      onClose={onClose}
    >
      <fieldset className={ui.field}>
        <legend className={dialog.legend}>Type</legend>
        <Segmented label="Type" options={DEAL_TYPES.map((value) => ({ value, label: DEAL_TYPE_LABELS[value] }))} value={type} onChange={setType} />
      </fieldset>
      <div className={dialog.pair}>
        <Field
          label="Org"
          error={issues.orgId}
          hint={orgs.error ? 'Couldn’t load orgs. Close this and try again.' : orgs.data && orgList.length === 0 ? 'No orgs yet. Add one in Orgs first.' : undefined}
        >
          {(control) => (
            <select {...control} className={ui.input} value={orgId} onChange={(event) => setOrgId(event.target.value)}>
              <option value="">{orgs.loading && !orgs.data ? 'Loading…' : 'Pick an org'}</option>
              {orgList.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Contact" error={issues.contactKey}>
          {(control) => <PersonPicker {...control} value={contact} onChange={setContact} kinds={['contact', 'alum']} placeholder="Who there (optional)" />}
        </Field>
      </div>
      <Field label="What it is" error={issues.title}>
        {(control) => (
          <input
            {...control}
            className={ui.input}
            placeholder="Spring hack night sponsor"
            value={title}
            maxLength={160}
            onChange={(event) => setTitle(event.target.value)}
          />
        )}
      </Field>
      <div className={dialog.pair}>
        <Field label="Ask" hint="As people say it: $3,000, a room, a talk" error={issues.ask}>
          {(control) => <input {...control} className={ui.input} value={ask} maxLength={120} onChange={(event) => setAsk(event.target.value)} />}
        </Field>
        <Field label="Amount" hint="Dollars, when there’s money in it" error={issues.amountCents}>
          {(control) => <input {...control} className={ui.input} inputMode="decimal" placeholder="3000" value={amount} onChange={(event) => setAmount(event.target.value)} />}
        </Field>
      </div>
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
    </FormDialog>
  )
}
