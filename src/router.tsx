import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '@/routes/login';
import { DashboardPage } from '@/routes/dashboard';
import { SettingsPage } from '@/routes/settings';
import { ClientsPage } from '@/routes/clients';
import { InvoiceEditorPage } from '@/routes/invoice-editor';
import { PdfFontExperimentPage } from '@/routes/pdf-font-experiment';
import { RequireAuth } from '@/components/RequireAuth';

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

const loginSearchSchema = z.object({
  from: z.string().optional(),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search) => loginSearchSchema.parse(search),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: () => (
    <RequireAuth>
      <ClientsPage />
    </RequireAuth>
  ),
});

const invoiceEditorSearchSchema = z.object({
  clientId: z.string().optional(),
});

const invoiceEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoice-editor/$id',
  component: () => (
    <RequireAuth>
      <InvoiceEditorPage />
    </RequireAuth>
  ),
  validateSearch: (search) => invoiceEditorSearchSchema.parse(search),
});

const pdfFontExperimentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pdf-font-experiment',
  component: PdfFontExperimentPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  settingsRoute,
  clientsRoute,
  invoiceEditorRoute,
  pdfFontExperimentRoute,
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
