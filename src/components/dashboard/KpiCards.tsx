import { Card } from '@/components/ui';
import { useTranslate } from '@/hooks';
import type { DashboardKpi } from '@/lib/utils/dashboardKpi';

interface KpiTileProps {
  label: string;
  value: string;
  hint?: string;
  tone: 'neutral' | 'blue' | 'rose' | 'emerald';
}

const TONE: Record<KpiTileProps['tone'], string> = {
  neutral: 'text-slate-900',
  blue: 'text-blue-700',
  rose: 'text-rose-700',
  emerald: 'text-emerald-700',
};

function KpiTile({ label, value, hint, tone }: KpiTileProps) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${TONE[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export interface KpiCardsProps {
  kpi: DashboardKpi;
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const t = useTranslate();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile label={t['dashboard.kpi.issuedThisMonth']} value={kpi.issuedThisMonth.format()} tone="neutral" />
      <KpiTile label={t['dashboard.kpi.awaitingPayment']} value={kpi.awaitingPayment.format()} tone="blue" />
      <KpiTile
        label={t['dashboard.kpi.overdue']}
        value={`${kpi.overdueCount} ${t['dashboard.kpi.invoicesShort']}`}
        tone="rose"
      />
      <KpiTile label={t['dashboard.kpi.paidYtd']} value={kpi.paidYtd.format()} tone="emerald" />
    </div>
  );
}
