import { createBrowserRouter, redirect, RouterProvider } from 'react-router'
import { adminRoutes } from './admin/routes'
import { Layout } from './components/Layout'
import { LoadError, PageLoading } from './components/RouteStates'
import { PLAYBOOK_HREF } from './content/guides/links'
import { ORGS } from './content/resourcesHub'
import { fetchContent, fetchEventPage, fetchHome, fetchRolePage, fetchWinPage } from './lib/content'
import { Board } from './pages/Board'
import { EventDetail, EventLoadError } from './pages/EventDetail'
import { Events } from './pages/Events'
import { Grants } from './pages/Grants'
import { Hackathons } from './pages/Hackathons'
import { Home } from './pages/Home'
import { Join } from './pages/Join'
import { NotFound } from './pages/NotFound'
import { OrgPage } from './pages/OrgPage'
import { Playbook } from './pages/Playbook'
import { Privacy } from './pages/Privacy'
import { Resources } from './pages/Resources'
import { RoleDetail, RoleLoadError } from './pages/RoleDetail'
import { Roles } from './pages/Roles'
import { Terms } from './pages/Terms'
import { TrackRecord } from './pages/TrackRecord'
import { WinDetail, WinLoadError } from './pages/WinDetail'
import { Wins } from './pages/Wins'

// Pages that read from the API. Layout has no loader, so on first load it (and the field) renders
// at once and only the page shows its fallback; the field never remounts when the data lands.
const dataRoute = { HydrateFallback: PageLoading, ErrorBoundary: LoadError }

// Every page renders inside Layout, so the field and the top bar mount once and stay put.
const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      { index: true, Component: Home, loader: ({ request }) => fetchHome(request.signal), ...dataRoute },
      {
        path: 'hackathons',
        Component: Hackathons,
        loader: ({ request }) => fetchContent('hackathons', request.signal),
        ...dataRoute,
      },
      // Hackathons had their own pages once; each card now opens the hackathon's site, so old
      // links land on the list instead of a 404.
      { path: 'hackathons/:id', loader: () => redirect('/hackathons'), HydrateFallback: PageLoading },
      { path: 'grants', Component: Grants },
      { path: 'wins', Component: Wins, loader: ({ request }) => fetchContent('wins', request.signal), ...dataRoute },
      {
        path: 'wins/:id',
        Component: WinDetail,
        loader: ({ params, request }) => fetchWinPage(params.id, request.signal),
        HydrateFallback: PageLoading,
        // Detail pages: like LoadError, but a missing or unpublished row gets a not-found state.
        ErrorBoundary: WinLoadError,
      },
      { path: 'track-record', Component: TrackRecord },
      // The hub: the playbook, then BU's programs for builders.
      { path: 'resources', Component: Resources },
      { path: 'resources/playbook', Component: Playbook },
      {
        path: 'resources/playbook/:slug',
        // Lazy, so the guides' long text loads only when someone opens one.
        lazy: { Component: async () => (await import('./pages/Guide')).Guide },
        HydrateFallback: PageLoading,
      },
      // A BU program's page (/resources/spark, /resources/innovate). Anything else here is a guide
      // from before the playbook had its own page, so old links follow it there.
      {
        path: 'resources/:slug',
        loader: ({ params }) => (ORGS.some((org) => org.slug === params.slug) ? null : redirect(`${PLAYBOOK_HREF}/${params.slug ?? ''}`)),
        Component: OrgPage,
        HydrateFallback: PageLoading,
      },
      { path: 'events', Component: Events, loader: ({ request }) => fetchContent('events', request.signal), ...dataRoute },
      {
        path: 'events/:id',
        Component: EventDetail,
        loader: ({ params, request }) => fetchEventPage(params.id, request.signal),
        HydrateFallback: PageLoading,
        ErrorBoundary: EventLoadError,
      },
      {
        path: 'about',
        // The open seats it lists come from the board. If that can't load, the page still shows,
        // just without them: it's mostly words, so a failed fetch shouldn't cost the whole page.
        loader: ({ request }) => fetchContent('board', request.signal).catch(() => null),
        lazy: { Component: async () => (await import('./pages/About')).About },
        HydrateFallback: PageLoading,
      },
      { path: 'board', Component: Board, loader: ({ request }) => fetchContent('board', request.signal), ...dataRoute },
      // The parts of Proto that need someone, and each one's page with its application.
      { path: 'roles', Component: Roles, loader: ({ request }) => fetchContent('roles', request.signal), ...dataRoute },
      {
        path: 'roles/:id',
        Component: RoleDetail,
        loader: ({ params, request }) => fetchRolePage(params.id, request.signal),
        HydrateFallback: PageLoading,
        ErrorBoundary: RoleLoadError,
      },
      { path: 'join', Component: Join },
      { path: 'privacy', Component: Privacy },
      { path: 'terms', Component: Terms },
      { path: '*', Component: NotFound },
    ],
  },
  ...adminRoutes,
])

export default function App() {
  return <RouterProvider router={router} />
}
