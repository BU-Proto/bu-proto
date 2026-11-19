import type { RouteObject } from 'react-router'
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
          {
            index: true,
            lazy: {
              loader: async () => (await loaders()).dashboardLoader,
              Component: async () => (await import('./pages/Dashboard')).Component,
            },
          },
          {
            path: 'admins',
            lazy: {
              loader: async () => (await loaders()).adminsLoader,
              Component: async () => (await import('./pages/Admins')).Component,
            },
          },
          // Members, fund and email are whole modules (Component, maybe loader) from admin-people.
          { path: 'members', lazy: () => import('./pages/Members') },
          { path: 'members/:id', lazy: () => import('./pages/MemberDetail') },
          { path: 'fund', lazy: () => import('./pages/Fund') },
          { path: 'email', lazy: () => import('./pages/Email') },
          { path: 'email/automatic', lazy: () => import('./pages/AutomaticEmails') },
          // Asks: emails to one person we need something from, which Claude drafts. Part of Email.
          // The inbox: one-to-one email, beside Compose (list emails).
          { path: 'email/inbox', lazy: () => import('./pages/Inbox') },
          { path: 'email/inbox/:id', lazy: () => import('./pages/Thread') },
          { path: 'email/asks', lazy: () => import('./pages/Asks') },
          { path: 'email/asks/new', lazy: () => import('./pages/AskNew') },
          { path: 'email/asks/:id', lazy: () => import('./pages/AskDetail') },
          { path: 'email/contacts', lazy: () => import('./pages/Contacts') },
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
