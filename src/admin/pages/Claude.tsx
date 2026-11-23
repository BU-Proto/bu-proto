import { useState, type FormEvent } from 'react'
import { MCP_TOKEN_DAYS, type McpToken, type McpTokenInput } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { formatRelative } from '../lib/format'
import { useSession } from '../lib/session'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import styles from './Claude.module.css'

const EMPTY: Required<McpTokenInput> = { label: '', readOnly: false, days: 90 }

/** The command that adds the portal to Claude Code, with a token in it. */
const claudeCodeCommand = (token: string) =>
  `claude mcp add --transport http proto ${location.origin}/api/mcp --header "Authorization: Bearer ${token}"`

/** The same for any client that takes a JSON config (Claude Desktop through mcp-remote, Cursor, …). */
const jsonConfig = (token: string) =>
  JSON.stringify(
    {
      mcpServers: {
        proto: { type: 'http', url: `${location.origin}/api/mcp`, headers: { Authorization: `Bearer ${token}` } },
      },
    },
    null,
    2,
  )

/**
 * Connect Claude (or any MCP client) to the portal: each teammate makes their own tokens, and a
 * token can do exactly what they can, no more. See worker/routes/mcp.ts.
 */
export function Component() {
  const toast = useToast()
  const { me } = useSession()
  const { data, error, loading, setData } = useApi<{ items: McpToken[] }>('/admin/mcp-tokens')
  const [form, setForm] = useState<Required<McpTokenInput> | null>(null)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [made, setMade] = useState<{ token: string; label: string } | null>(null)
  const [revoking, setRevoking] = useState<McpToken | null>(null)
  const tokens = data?.items ?? []

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (!form || busy) return
    setBusy(true)
    setIssues({})
    setFormError('')
    try {
      const { item, token } = await api<{ item: McpToken; token: string }>('/admin/mcp-tokens', { method: 'POST', body: form })
      setData((prev) => ({ items: [item, ...(prev?.items ?? [])] }))
      setMade({ token, label: item.label })
      setForm(null)
    } catch (failure) {
      const apiError = toApiError(failure)
      setIssues(apiError.issues)
      setFormError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!revoking) return
    setBusy(true)
    try {
      await api(`/admin/mcp-tokens/${revoking.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== revoking.id) })
      toast('Token revoked')
      setRevoking(null)
    } catch (failure) {
      setFormError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${what} copied`)
    } catch {
      toast('Couldn’t copy. Select it and copy it yourself.')
    }
  }

  return (
    <div className={shared.page}>
      <PageHeader
        title="Claude"
        tabTitle="Connect Claude"
        lede={
          <>
            Use the portal from Claude Code, Claude Desktop or any MCP client: ask what needs doing today, log a coffee, move a deal along, draft a reply. A
            token acts as you, with your access ({me.level === 'owner' ? 'owner' : me.level}). It can’t change who has access or make more tokens, and it never
            sends an email unless you tell Claude to send that exact email.
          </>
        }
        actions={
          <button
            type="button"
            className={ui.primary}
            onClick={() => {
              setIssues({})
              setFormError('')
              setMade(null)
              setForm(EMPTY)
            }}
          >
            <PlusIcon /> New token
          </button>
        }
      />
      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {made && (
        <section className={shared.panel} aria-live="polite">
          <div className={styles.stack}>
            <h2 className={ui.panelTitle}>“{made.label}” is ready. Copy it now: it won’t be shown again.</h2>
            <div className={styles.snippet}>
              <code className={styles.code}>{made.token}</code>
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => copy(made.token, 'Token')}>
                Copy
              </button>
            </div>
            <h3 className={styles.subhead}>Claude Code</h3>
            <div className={styles.snippet}>
              <code className={styles.code}>{claudeCodeCommand(made.token)}</code>
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => copy(claudeCodeCommand(made.token), 'Command')}>
                Copy
              </button>
            </div>
            <h3 className={styles.subhead}>Other MCP clients (JSON config)</h3>
            <div className={styles.snippet}>
              <pre className={styles.code}>{jsonConfig(made.token)}</pre>
              <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => copy(jsonConfig(made.token), 'Config')}>
                Copy
              </button>
            </div>
            <p className={ui.dim}>Keep it like a password: anyone with it can use the portal as you. Revoke it here if it leaks.</p>
            <div>
              <button type="button" className={ui.ghost} onClick={() => setMade(null)}>
                Done
              </button>
            </div>
          </div>
        </section>
      )}

      {form && (
        <form className={shared.panel} onSubmit={create} noValidate>
          <div className={styles.stack}>
            <h2 className={ui.panelTitle}>New token</h2>
            <Field label="What it’s for" error={issues.label} hint="“Claude Code on my laptop”, so you know which one to revoke.">
              {(props) => <input {...props} className={ui.input} value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />}
            </Field>
            <Field label="Lasts" error={issues.days}>
              {(props) => (
                <select {...props} className={ui.input} value={form.days} onChange={(event) => setForm({ ...form, days: Number(event.target.value) as typeof form.days })}>
                  {MCP_TOKEN_DAYS.map((days) => (
                    <option key={days} value={days}>
                      {days === 365 ? 'A year' : `${days} days`}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <label className={styles.check}>
              <input type="checkbox" checked={form.readOnly} onChange={(event) => setForm({ ...form, readOnly: event.target.checked })} />
              <span>
                Read-only <span className={ui.dim}>Claude can look at everything and change nothing.</span>
              </span>
            </label>
            <div className={styles.row}>
              <button type="submit" className={ui.primary} disabled={busy}>
                {busy ? 'Making…' : 'Make token'}
              </button>
              <button type="button" className={ui.ghost} onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
            <p className={shared.error} role="alert" hidden={!formError}>
              {formError}
            </p>
          </div>
        </form>
      )}

      {!data && loading ? (
        <div className={shared.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 240 }} />
        </div>
      ) : data && tokens.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>No tokens yet</h2>
          <p>Make one to connect Claude. You can have up to ten, and revoke any of them here.</p>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>For</th>
                <th>Access</th>
                <th>Last used</th>
                <th>Expires</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td>
                    <span className={ui.rowTitle}>{token.label}</span>
                    <div className={ui.dim}>Made {formatRelative(token.createdAt)}</div>
                  </td>
                  <td data-label="Access">{token.readOnly ? 'Read-only' : 'Same as you'}</td>
                  <td data-label="Last used" className={ui.dim}>
                    {token.lastUsedAt ? formatRelative(token.lastUsedAt) : 'Never'}
                  </td>
                  <td data-label="Expires" className={ui.dim}>
                    {formatRelative(token.expiresAt)}
                  </td>
                  <td className={ui.rowActions}>
                    <button type="button" className={`${ui.dangerGhost} ${ui.small}`} onClick={() => setRevoking(token)}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog
        open={revoking !== null}
        title={revoking ? `Revoke “${revoking.label}”?` : 'Revoke token?'}
        confirmLabel="Revoke token"
        danger
        busy={busy}
        onConfirm={revoke}
        onCancel={() => setRevoking(null)}
      >
        <p>Whatever uses it stops working right away.</p>
      </ConfirmDialog>
    </div>
  )
}
