import { createBrowserRouter, RouterProvider } from 'react-router'
import { adminRoutes } from './admin/routes'
import { Layout } from './components/Layout'
import { LoadError, PageLoading } from './components/RouteStates'
import { fetchContent, fetchHome } from './lib/content'
import { Board } from './pages/Board'
import { Events } from './pages/Events'
import { Grants } from './pages/Grants'
import { Hackathons } from './pages/Hackathons'
import { Home } from './pages/Home'
import { Join } from './pages/Join'
import { NotFound } from './pages/NotFound'
import { Resources } from './pages/Resources'
import { TrackRecord } from './pages/TrackRecord'
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
      { path: 'grants', Component: Grants },
      { path: 'wins', Component: Wins, loader: ({ request }) => fetchContent('wins', request.signal), ...dataRoute },
      { path: 'track-record', Component: TrackRecord },
      { path: 'resources', Component: Resources },
      { path: 'events', Component: Events, loader: ({ request }) => fetchContent('events', request.signal), ...dataRoute },
      { path: 'board', Component: Board, loader: ({ request }) => fetchContent('board', request.signal), ...dataRoute },
      { path: 'join', Component: Join },
      { path: '*', Component: NotFound },
    ],
  },
  ...adminRoutes,
])

export default function App() {
  return <RouterProvider router={router} />
}
