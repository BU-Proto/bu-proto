import { Hono } from 'hono'
import { gateWrites } from './lib/access'
import { draftFollowUps } from './lib/asks'
import { errorBody } from './lib/http'
import { runImports } from './lib/importers'
import { requireAdmin, sameOrigin } from './lib/session'
import activity from './routes/activity'
import admins from './routes/admins'
import asks from './routes/asks'
import auth from './routes/auth'
import content from './routes/content'
import devpost from './routes/devpost'
import email from './routes/email'
import eventImport from './routes/eventImport'
import inbox from './routes/inbox'
import { mcpRoutes } from './routes/mcp'
import imports from './routes/imports'
import pages from './routes/pages'
import people from './routes/people'
import pipeline from './routes/pipeline'
import publicForms from './routes/public'
import relationships from './routes/relationships'
import today from './routes/today'
import uploads from './routes/uploads'
import type { AppEnv } from './types'

// The API behind the site. Static assets and the client router are served by Workers Assets;
// only /api/*, /privacy and /terms reach this Worker (see run_worker_first in wrangler.jsonc).
//
// Every router below defines full paths under /api. Two rules hold for all of them:
// - state-changing requests must come from this origin (sameOrigin), except the unsubscribe link,
//   Resend's webhook and the MCP endpoint, which prove themselves another way (a token, a signature,
//   a bearer token)
// - everything under /api/admin needs a signed-in admin (requireAdmin sets c.var.admin)

const app = new Hono<AppEnv>()

app.use('/api/*', sameOrigin)
app.use('/api/admin/*', requireAdmin)
app.use('/api/admin/*', gateWrites) // who can change what: lib/access.ts

app.route('/', auth) //         /api/auth/*
app.route('/', admins) //       /api/admin/me, /api/admin/admins
app.route('/', content) //      /api/content/*, /api/admin/content/*, RSVP admin
app.route('/', publicForms) //  /api/join, /api/fund-interest, /api/roles/:id/apply, /api/events/:id/rsvp
app.route('/', people) //       /api/admin/members, /api/admin/fund, /api/admin/applications, /api/admin/stats
app.route('/', email) //        /api/admin/email/*, /api/unsubscribe
app.route('/', imports) //      /api/admin/hackathon-imports/*
app.route('/', devpost) //      /api/admin/devpost/* (projects → win drafts)
app.route('/', eventImport) //  /api/admin/event-import/* (Luma, Eventbrite pages → event drafts)
app.route('/', uploads) //      /api/admin/uploads (portal), /api/uploads/:name (the pictures)
app.route('/', asks) //         /api/admin/asks/*, /api/admin/contacts, /api/admin/facts
app.route('/', inbox) //        /api/inbound/resend (Resend's webhook), /api/admin/inbox/*
app.route('/', relationships) // /api/admin/people*, /api/admin/orgs* (the CRM: shared/crm.ts)
app.route('/', pipeline) //     /api/admin/deals*
app.route('/', activity) //     /api/admin/interactions*, /follow-ups*, /intros*, /events/:id/guests*
app.route('/', today) //        /api/admin/today, /api/admin/queue*
app.route('/', pages) //        /privacy, /terms rendered for crawlers
// /api/mcp (the portal as an MCP server, bearer token) and /api/admin/mcp-tokens. Its tools call
// the routes above in-process, through this same app, as the token's teammate.
app.route('/', mcpRoutes(async (request, env, ctx) => app.fetch(request, env, ctx)))

app.notFound((c) => c.json({ error: 'Not found.' }, 404))
app.onError((error, c) => {
  const { status, body } = errorBody(error)
  return c.json(body, status as 400)
})

// The daily Cron Trigger (wrangler.jsonc) imports upcoming hackathons from MLH and Devpost, and
// drafts a follow-up for each ask that's gone unanswered past its day (drafted, never sent).
export default {
  fetch: app.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(runImports(env))
    ctx.waitUntil(draftFollowUps(env))
  },
} satisfies ExportedHandler<Env>
