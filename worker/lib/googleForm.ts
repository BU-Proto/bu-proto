import type { FormAnswer, FormField } from '../../shared/api'

// A public Google Form: its questions are read from the page itself (the FB_PUBLIC_LOAD_DATA_
// the form ships with), and Claude's answers become a prefilled link, so a teammate opens the
// form with everything in, checks it and presses Submit themselves. A form that needs a sign-in
// (BU-only, or one response per person) can't be read: its questions get pasted instead.

const HOSTS = new Set(['docs.google.com', 'forms.gle'])

export function isGoogleFormUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return HOSTS.has(parsed.hostname) && (parsed.hostname === 'forms.gle' || parsed.pathname.startsWith('/forms/'))
  } catch {
    return false
  }
}

/** Google's question types, by the number in the page's data. */
const TYPES: Record<number, Pick<FormField, 'type' | 'multi'>> = {
  0: { type: 'text' },
  1: { type: 'paragraph' },
  2: { type: 'choice' },
  3: { type: 'choice' },
  4: { type: 'choice', multi: true },
  5: { type: 'choice' },
  9: { type: 'date' },
  10: { type: 'time' },
}

export interface GoogleForm {
  title: string
  /** The form's viewform address, without its query: prefilled links start from it. */
  url: string
  fields: FormField[]
}

/** The form's title and questions, or null when the page can't be read without signing in. */
export async function readGoogleForm(url: string): Promise<GoogleForm | null> {
  let response: Response
  try {
    response = await fetch(url, { redirect: 'follow', headers: { 'Accept-Language': 'en-US' } })
  } catch {
    return null
  }
  const final = new URL(response.url || url)
  if (!response.ok || final.hostname !== 'docs.google.com' || !final.pathname.startsWith('/forms/')) return null
  const html = await response.text()
  const match = /FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/.exec(html)
  if (!match) return null
  let data: unknown
  try {
    data = JSON.parse(match[1])
  } catch {
    return null
  }
  const root = Array.isArray(data) ? data : []
  const body = Array.isArray(root[1]) ? (root[1] as unknown[]) : []
  const items = Array.isArray(body[1]) ? (body[1] as unknown[]) : []
  const title = typeof body[8] === 'string' && body[8] ? body[8] : typeof root[3] === 'string' ? root[3] : 'Google Form'

  const fields: FormField[] = []
  for (const raw of items) {
    if (!Array.isArray(raw)) continue
    const [, itemTitle, description, typeCode, entries] = raw as [unknown, unknown, unknown, unknown, unknown]
    const type = typeof typeCode === 'number' ? TYPES[typeCode] : undefined
    if (!type || !Array.isArray(entries)) continue
    const label = [itemTitle, description].filter((part): part is string => typeof part === 'string' && part.trim() !== '').join(' — ')
    for (const entry of entries) {
      if (!Array.isArray(entry) || typeof entry[0] !== 'number') continue
      const options = Array.isArray(entry[1])
        ? (entry[1] as unknown[]).map((option) => (Array.isArray(option) ? option[0] : null)).filter((option): option is string => typeof option === 'string' && option !== '')
        : []
      const required = entry[2] === 1
      fields.push({
        name: `entry.${entry[0]}`,
        label: `${label || 'Untitled question'}${required ? ' (required)' : ''}`,
        ...type,
        ...(options.length && { options }),
      })
    }
  }
  final.search = ''
  final.hash = ''
  final.pathname = `${final.pathname.replace(/\/(formResponse|viewform)?\/?$/, '')}/viewform`
  return { title, url: final.toString(), fields }
}

/** The form's link with each answer filled in. A multi-choice answer ("A; B") fills several boxes. */
export function prefillUrl(viewUrl: string, fields: FormField[], answers: FormAnswer[]): string | null {
  if (!viewUrl || answers.length === 0) return null
  const url = new URL(viewUrl)
  url.searchParams.set('usp', 'pp_url')
  const known = new Map(fields.map((field) => [field.name, field]))
  for (const answer of answers) {
    const field = known.get(answer.field)
    if (!field || !answer.value.trim()) continue
    const values = field.multi ? answer.value.split(';').map((value) => value.trim()) : [answer.value.trim()]
    for (const value of values) if (value) url.searchParams.append(field.name, value)
  }
  return url.toString()
}
