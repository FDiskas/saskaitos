import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  useBootstrap,
  useGoogleAuth,
  useInvoiceList,
  useInvoiceStatus,
} from '@/hooks';
import { env } from '@/env';
import { CompanyProfileSwitcher, SyncStatusBadge } from '@/components/shared';
import { Card, CardBody } from '@/components/ui';
import {
  DashboardFilters,
  InvoiceListTable,
  KpiCards,
  RevenueCharts,
  type DashboardFilterValues,
} from '@/components/dashboard';
import { computeKpi } from '@/lib/utils/dashboardKpi';
import { filterSummaries } from '@/lib/utils/filterInvoices';
import type { InvoiceStatus, InvoiceSummary } from '@/lib/domain';

const EMPTY_FILTERS: DashboardFilterValues = {
  search: '',
  clientId: null,
  statuses: [],
  dateFrom: null,
  dateTo: null,
};

export function DashboardPage() {
  const { user, isAuthenticated, logout } = useGoogleAuth();
  const navigate = useNavigate();
  const { isReady, isPending, error } = useBootstrap();

  useEffect(() => {
    if (!env.useInMemory && !isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sąskaitos — Dashboard</h1>
          <p className="text-sm text-slate-500">
            {env.useInMemory ? 'In-memory dev rėžimas' : user?.email ?? 'Sąskaitos sistema'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompanyProfileSwitcher />
          <SyncStatusBadge />
          <Link
            to="/invoice-editor/$id"
            params={{ id: 'new' }}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 shadow-sm cursor-pointer"
          >
            Nauja sąskaita
          </Link>
          <Link
            to="/clients"
            className="rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Klientai
          </Link>
          <Link
            to="/settings"
            className="rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Nustatymai
          </Link>
          {!env.useInMemory ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Atsijungti
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-rose-700">Klaida: {stringify(error)}</p>
          </CardBody>
        </Card>
      ) : !isReady ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              {isPending ? 'Tikrinama Drive struktūra…' : 'Laukiame prisijungimo.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <DashboardContent />
      )}
    </main>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const { summaries, isLoading } = useInvoiceList();
  const statusMutation = useInvoiceStatus();
  const [filters, setFilters] = useState<DashboardFilterValues>(EMPTY_FILTERS);

  const kpi = useMemo(() => computeKpi(summaries, today), [summaries, today]);
  const filtered = useMemo(
    () =>
      filterSummaries(
        summaries,
        {
          search: filters.search,
          clientId: filters.clientId,
          statuses: filters.statuses,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        today,
      ),
    [summaries, filters, today],
  );

  const handleOpen = (s: InvoiceSummary) => {
    void navigate({ to: `/invoice-editor/${s.id.toString()}` });
  };

  const handleStatus = (s: InvoiceSummary, status: InvoiceStatus) => {
    statusMutation.mutate({ summary: s, status });
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
          <p className="mt-4 text-sm font-medium text-slate-500">Kraunamos sąskaitos…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <RevenueCharts summaries={summaries} today={today} />
      <KpiCards kpi={kpi} />
      <DashboardFilters values={filters} onChange={setFilters} />
      <InvoiceListTable
        summaries={filtered}
        today={today}
        onRowOpen={handleOpen}
        onStatusChange={handleStatus}
      />
    </div>
  );
}

function stringify(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
