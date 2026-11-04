import { Hono } from 'hono'
import { CONTACT_EMAIL, EFFECTIVE_DATE, PRIVACY, TERMS, type Block, type LegalDoc, type Rich } from '../../src/content/legal'
import { escapeHtml } from '../lib/emailTemplate'
import type { AppEnv } from '../types'

// The site is a client-rendered app, so every page reaches a crawler as an empty <div id="root">.
// Google's OAuth review reads the privacy policy from the raw HTML and doesn't run scripts, so
// these two pages are rendered here, into the same index.html the app uses. React replaces the
// markup as soon as it loads, so people still get the normal page.

const app = new Hono<AppEnv>()

function inline(rich: Rich): string {
  if (typeof rich === 'string') return escapeHtml(rich)
  return rich
    .map((part) => {
      if (typeof part === 'string') return escapeHtml(part)
      if ('strong' in part) return `<strong>${escapeHtml(part.strong)}</strong>`
      return `<a href="${escapeHtml(part.href)}">${escapeHtml(part.label)}</a>`
    })
    .join('')
}

function block(item: Block): string {
  if (typeof item === 'object' && !Array.isArray(item) && 'list' in item) {
    return `<ul>${item.list.map((entry) => `<li>${inline(entry)}</li>`).join('')}</ul>`
  }
  return `<p>${inline(item as Rich)}</p>`
}

function render(doc: LegalDoc): string {
  const contents = doc.sections.map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`)
  const sections = doc.sections.map(
    (section) =>
      `<section id="${section.id}"><h2>${escapeHtml(section.title)}</h2>${section.body.map(block).join('')}</section>`,
  )
  return `<main style="max-width:72ch;margin:0 auto;padding:48px 20px;font-family:Inter,system-ui,sans-serif;line-height:1.7;color:#f6fbff;background:#061a2e">
<p><a href="/" style="color:#9df0a8">BU Proto</a></p>
<h1>${escapeHtml(doc.intro.title)}</h1>
<p>${escapeHtml(doc.intro.lede)}</p>
<p>Effective ${escapeHtml(EFFECTIVE_DATE)}. Contact: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
<nav aria-label="${escapeHtml(doc.contentsLabel)}"><ul>${contents.join('')}</ul></nav>
${sections.join('\n')}
<p><a href="${escapeHtml(doc.other.href)}">${escapeHtml(doc.other.label)}</a></p>
</main>`
}

const DOCS = { '/privacy': PRIVACY, '/terms': TERMS } as const

for (const [path, doc] of Object.entries(DOCS)) {
  app.get(path, async (c) => {
    // The app's own shell, so its scripts and styles load and take over as usual.
    const shell = await c.env.ASSETS.fetch(new URL('/', c.req.url))
    const title = `${doc.intro.title} · BU Proto`
    return new HTMLRewriter()
      .on('title', { element: (el) => void el.setInnerContent(title) })
      .on('meta[name="description"]', { element: (el) => void el.setAttribute('content', doc.intro.lede) })
      .on('#root', { element: (el) => void el.setInnerContent(render(doc), { html: true }) })
      .transform(shell)
  })
}

export default app
