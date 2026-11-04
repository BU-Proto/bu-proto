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
          // events | hackathons | wins | board; anything else is a 404 from the loader.
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
