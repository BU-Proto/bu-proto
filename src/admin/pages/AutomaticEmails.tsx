import { useState } from 'react'
import type { AutomaticEmail, AutomaticEmailKey } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { PageHeader } from '../components/PageHeader'
import { useSession } from '../lib/session'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import email from './Email.module.css'
import styles from './AutomaticEmails.module.css'

type Result = { ok: boolean; text: string }

/** The emails the public forms send on their own, rendered by the Worker exactly as they go out. */
export function Component() {
  const { me } = useSession()
  const emails = useApi<{ items: AutomaticEmail[] }>('/admin/email/automatic')
  const items = emails.data?.items ?? []
  const [picked, setPicked] = useState<AutomaticEmailKey>('welcome')
  const [mode, setMode] = useState<'html' | 'text'>('html')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const current = items.find((item) => item.key === picked) ?? items[0]

  const pick = (key: AutomaticEmailKey) => {
    setPicked(key)
    setResult(null)
  }

  const sendTest = async () => {
    if (!current || testing) return
    setTesting(true)
    setResult(null)
    try {
      const sent = await api<{ ok: true; logged: boolean }>(`/admin/email/automatic/${current.key}/test`, { method: 'POST' })
      setResult({
        ok: true,
        text: sent.logged
          ? `Logged, not sent: RESEND_API_KEY isn’t set, so nothing actually left for ${me.email}.`
          : `Test sent to ${me.email}. Check the inbox (and spam).`,
      })
    } catch (error) {
      setResult({ ok: false, text: toApiError(error).message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={shared.page}>
      <PageHeader
        title="Email"
        tabTitle="Automatic emails"
        lede="What the site sends on its own when someone joins, RSVPs or signs up for grants. Shown with your name and the next real event."
      />

      {emails.error && (
        <p className={shared.error} role="alert">
          {emails.error.message}
        </p>
      )}

      {!emails.data ? (
        !emails.error && <p className={shared.dim}>Rendering…</p>
      ) : (
        current && (
          <div className={styles.layout}>
            <ul className={styles.list} aria-label="Automatic emails">
              {items.map((item) => (
                <li key={item.key}>
                  <button type="button" className={styles.pick} aria-pressed={item.key === current.key} onClick={() => pick(item.key)}>
                    <span className={styles.pickTitle}>{item.title}</span>
                    <span className={styles.pickWhen}>{item.when}</span>
                  </button>
                </li>
              ))}
            </ul>

            <section className={`${shared.panel} ${email.preview}`} aria-labelledby="automatic-preview">
              <div className={email.previewHead}>
                <h2 id="automatic-preview" className={shared.panelTitle}>
                  {current.title}
                </h2>
                <div className={email.modes} role="group" aria-label="Preview format">
                  {(['html', 'text'] as const).map((value) => (
                    <button key={value} type="button" className={email.mode} aria-pressed={mode === value} onClick={() => setMode(value)}>
                      {value === 'html' ? 'HTML' : 'Plain text'}
                    </button>
                  ))}
                </div>
              </div>
              <p className={styles.subject}>{current.subject}</p>
              {current.sampleEvent && <p className={shared.hint}>Nothing is on the calendar, so this uses an example event.</p>}
              {mode === 'html' ? (
                <iframe className={email.frame} title={`Email preview: ${current.subject}`} sandbox="" srcDoc={current.html} />
              ) : (
                <pre className={email.plain}>{current.text}</pre>
              )}
              <div className={styles.test}>
                <button type="button" className={ui.button} onClick={sendTest} disabled={testing} aria-busy={testing || undefined}>
                  {testing ? 'Sending…' : 'Send me a test'}
                </button>
                <p className={shared.hint}>Goes to {me.email}, with “[Test]” in the subject.</p>
              </div>
              <div aria-live="polite">{result && <p className={result.ok ? shared.status : shared.error}>{result.text}</p>}</div>
            </section>
          </div>
        )
      )}
    </div>
  )
}
