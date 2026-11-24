import { redirect, type RouteObject } from 'react-router'
import { Loading } from './components/Loading'

// The portal. Everything but the loading line is lazy, so none of it ships in the public
// site's bundle. Data comes from ./loaders and components from ./pages, loaded side by side,
// so a page's fetch starts without waiting for its code. App.tsx spreads these at the top
// level, outside the public Layout.

const loaders = () => import('./loaders')

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    HydrateFallback: Loading,
    lazy: {
      loader: async () => (await loaders()).layoutLoader,
      Component: async () => (await import('./AdminLayout')).Component,
      ErrorBoundary: async () => (await import('./AdminLayout')).ErrorBoundary,
    },
    children: [
      {
        // Errors from any page render here, inside the shell, so the sidebar stays usable.
        lazy: { ErrorBoundary: async () => (await import('./components/RouteError')).RouteError },
        children: [
          // Today: what needs doing (follow-ups, the Inbox, what's coming up). Replaces the old overview.
          { index: true, lazy: () => import('./pages/Today') },
          // The Inbox: everything waiting on us, from email replies to sign-ups to fund requests.
          { path: 'inbox', lazy: () => import('./pages/Queue') },
          // The CRM: people (members and contacts, keyed m12 / c4), orgs, deals and activity.
          { path: 'people', lazy: () => import('./pages/People') },
          { path: 'people/:key', lazy: () => import('./pages/Person') },
          { path: 'orgs', lazy: () => import('./pages/Orgs') },
          { path: 'orgs/:id', lazy: () => import('./pages/Org') },
          { path: 'pipeline', lazy: () => import('./pages/Pipeline') },
          { path: 'pipeline/:id', lazy: () => import('./pages/Deal') },
          { path: 'activity', lazy: () => import('./pages/Activity') },
          { path: 'activity/follow-ups', lazy: () => import('./pages/Activity') },
          { path: 'activity/intros', lazy: () => import('./pages/Activity') },
          // MCP tokens: connect Claude (or any MCP client) to the portal. A tab of Access.
          { path: 'admins/claude', lazy: () => import('./pages/Claude') },
          {
            path: 'admins',
            lazy: {
              loader: async () => (await loaders()).adminsLoader,
              Component: async () => (await import('./pages/Admins')).Component,
            },
          },
          // Members and contacts moved into People; old links and bookmarks land there.
          { path: 'members', loader: () => redirect('/admin/people?kind=member') },
          { path: 'members/:id', loader: ({ params }) => redirect(`/admin/people/m${params.id ?? ''}`) },
          // Fund and email are whole modules (Component, maybe loader) from admin-people.
          { path: 'fund', lazy: () => import('./pages/Fund') },
          // Applications to the Founders Circle. Before ':resource', which would take "founders" for a content type.
          { path: 'founders', lazy: () => import('./pages/Founders') },
          // Email opens on what needs doing; writing to a list is one of the pages it leads to.
          { path: 'email', lazy: () => import('./pages/EmailHome') },
          { path: 'email/compose', lazy: () => import('./pages/Email') },
          { path: 'email/automatic', lazy: () => import('./pages/AutomaticEmails') },
          // Asks: emails to one person we need something from, which Claude drafts. Part of Email.
          // The inbox: one-to-one email, beside Compose (list emails).
          { path: 'email/inbox', lazy: () => import('./pages/Inbox') },
          { path: 'email/inbox/:id', lazy: () => import('./pages/Thread') },
          { path: 'email/asks', lazy: () => import('./pages/Asks') },
          { path: 'email/asks/new', lazy: () => import('./pages/AskNew') },
          { path: 'email/asks/:id', lazy: () => import('./pages/AskDetail') },
          { path: 'email/contacts', loader: () => redirect('/admin/people?kind=contact') },
          { path: 'email/facts', lazy: () => import('./pages/Facts') },
          // Before ':resource/:id', or "import", "interest" and "applications" would be read as a row's id.
          { path: 'hackathons/import', lazy: () => import('./pages/HackathonImport') },
          { path: 'wins/import', lazy: () => import('./pages/WinImport') },
          { path: 'events/import', lazy: () => import('./pages/EventImport') },
          { path: 'board/interest', lazy: () => import('./pages/BoardInterest') },
          { path: 'roles/applications', lazy: () => import('./pages/Applications') },
          // events | hackathons | wins | board | roles; anything else is a 404 from the loader.
          {
            path: ':resource',
            lazy: {
              loader: async () => (await loaders()).contentListLoader,
              shouldRevalidate: async () => (await loaders()).contentListShouldRevalidate,
              Component: async () => (await import('./pages/ContentList')).Component,
            },
          },
          {
            path: ':resource/new',
            lazy: {
              loader: async () => (await loaders()).contentEditorLoader,
              Component: async () => (await import('./pages/ContentEditor')).Component,
            },
          },
          {
            path: ':resource/:id',
            lazy: {
              loader: async () => (await loaders()).contentEditorLoader,
              Component: async () => (await import('./pages/ContentEditor')).Component,
            },
          },
          { path: '*', lazy: { loader: async () => (await loaders()).notFoundLoader } },
        ],
      },
    ],
  },
]
