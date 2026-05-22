import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { LoginPage } from '@/routes/login';
import { DashboardPage } from '@/routes/dashboard';
import { SettingsPage } from '@/routes/settings';
import { ClientsPage } from '@/routes/clients';
import { InvoiceEditorPage } from '@/routes/invoice-editor';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: ClientsPage,
});

import { z } from 'zod';

const invoiceEditorSearchSchema = z.object({
  clientId: z.string().optional(),
});

const invoiceEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoice-editor/$id',
  component: InvoiceEditorPage,
  validateSearch: (search) => invoiceEditorSearchSchema.parse(search),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  settingsRoute,
  clientsRoute,
  invoiceEditorRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
