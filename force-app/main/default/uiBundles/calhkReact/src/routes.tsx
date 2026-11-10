import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import Home from './pages/Home';
import CalhkDemo from './pages/CalhkDemo';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <CalhkDemo />,
        handle: { showInNavigation: true, label: 'CalHack demo' },
      },
      {
        path: 'about',
        element: <Home />,
        handle: { showInNavigation: true, label: 'About' },
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
