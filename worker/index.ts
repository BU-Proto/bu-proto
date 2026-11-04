import { Hono } from 'hono'
import { errorBody } from './lib/http'
import { runImports } from './lib/importers'
import { requireAdmin, sameOrigin } from './lib/session'
import admins from './routes/admins'
import auth from './routes/auth'
import content from './routes/content'
import devpost from './routes/devpost'
import email from './routes/email'
import eventImport from './routes/eventImport'
import imports from './routes/imports'
import pages from './routes/pages'
import people from './routes/people'
import publicForms from './routes/public'
import type { AppEnv } from './types'

// The API behind the site. Static assets and the client router are served by Workers Assets;
// only /api/*, /privacy and /terms reach this Worker (see run_worker_first in wrangler.jsonc).
//
// Every router below defines full paths under /api. Two rules hold for all of them:
// - state-changing requests must come from this origin (sameOrigin)
// - everything under /api/admin needs a signed-in admin (requireAdmin sets c.var.admin)

const app = new Hono<AppEnv>()

app.use('/api/*', sameOrigin)
app.use('/api/admin/*', requireAdmin)

app.route('/', auth) //         /api/auth/*
app.route('/', admins) //       /api/admin/me, /api/admin/admins
app.route('/', content) //      /api/content/*, /api/admin/content/*, RSVP admin
app.route('/', publicForms) //  /api/join, /api/fund-interest, /api/events/:id/rsvp
app.route('/', people) //       /api/admin/members, /api/admin/fund, /api/admin/stats
app.route('/', email) //        /api/admin/email/*, /api/unsubscribe
app.route('/', imports) //      /api/admin/hackathon-imports/*
app.route('/', devpost) //      /api/admin/devpost/* (projects → win drafts)
app.route('/', eventImport) //  /api/admin/event-import/* (Luma, Eventbrite pages → event drafts)
app.route('/', pages) //        /privacy, /terms rendered for crawlers

app.notFound((c) => c.json({ error: 'Not found.' }, 404))
app.onError((error, c) => {
  const { status, body } = errorBody(error)
  return c.json(body, status as 400)
})

// The daily Cron Trigger (wrangler.jsonc) imports upcoming hackathons from MLH and Devpost.
export default {
  fetch: app.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(runImports(env))
  },
} satisfies ExportedHandler<Env>
