import { createBrowserRouter, RouterProvider } from 'react-router'
import { adminRoutes } from './admin/routes'
import { Layout } from './components/Layout'
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

// Every page renders inside Layout, so the field and the top bar mount once and stay put.
const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'hackathons', Component: Hackathons },
      { path: 'grants', Component: Grants },
      { path: 'wins', Component: Wins },
      { path: 'track-record', Component: TrackRecord },
      { path: 'resources', Component: Resources },
      { path: 'events', Component: Events },
      { path: 'board', Component: Board },
      { path: 'join', Component: Join },
      { path: '*', Component: NotFound },
    ],
  },
  ...adminRoutes,
])

export default function App() {
  return <RouterProvider router={router} />
}
