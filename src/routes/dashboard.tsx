import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  useBootstrap,
  useGoogleAuth,
  useInvoiceList,
  useInvoiceStatus,
  useSettings,
} from '@/hooks';
import { env } from '@/env';
import { AppHeader } from '@/components/shared';
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
  const { isAuthenticated } = useGoogleAuth();
  const navigate = useNavigate();
  const { isReady, isPending, error } = useBootstrap();

  useEffect(() => {
    if (!env.useInMemory && !isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <AppHeader
        title="Sąskaitos — Dashboard"
        current="dashboard"
        actions={
          <Link
            to="/invoice-editor/$id"
            params={{ id: 'new' }}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Nauja sąskaita
          </Link>
        }
      />

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
  const { settings } = useSettings();
  const [filters, setFilters] = useState<DashboardFilterValues>(EMPTY_FILTERS);

  const activeCompanyId = settings?.activeCompanyId ?? settings?.companies[0]?.id ?? null;

  const companyScopedSummaries = useMemo(
    () =>
      filterSummaries(
        summaries,
        { companyId: activeCompanyId },
        today,
      ),
    [summaries, activeCompanyId, today],
  );

  const kpi = useMemo(() => computeKpi(companyScopedSummaries, today), [companyScopedSummaries, today]);
  const filtered = useMemo(
    () =>
      filterSummaries(
        companyScopedSummaries,
        {
          search: filters.search,
          clientId: filters.clientId,
          statuses: filters.statuses,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        today,
      ),
    [companyScopedSummaries, filters, today],
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
      <RevenueCharts summaries={companyScopedSummaries} today={today} />
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
