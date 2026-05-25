import { useMemo } from 'react';
import { useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';
import type { InvoiceSummary } from '@/lib/domain';
import { annualRevenue, monthlyRevenue, quarterlyRevenue } from '@/lib/utils/revenueSeries';
import { RevenueBarChart } from './RevenueBarChart';

export interface RevenueChartsProps {
  summaries: InvoiceSummary[];
  today: Date;
}

const ANNUAL_YEARS_BACK = 4;

export function RevenueCharts({ summaries, today }: RevenueChartsProps) {
  const t = useTranslate();
  const year = today.getFullYear();
  const monthly = useMemo(() => monthlyRevenue(summaries, year), [summaries, year]);
  const quarterly = useMemo(() => quarterlyRevenue(summaries, year), [summaries, year]);
  const annual = useMemo(
    () => annualRevenue(summaries, year, ANNUAL_YEARS_BACK),
    [summaries, year],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <RevenueBarChart title={withParams(t['dashboard.revenue.monthly'], { year })} buckets={monthly} />
      <RevenueBarChart title={withParams(t['dashboard.revenue.quarterly'], { year })} buckets={quarterly} />
      <RevenueBarChart title={t['dashboard.revenue.annual']} buckets={annual} />
    </div>
  );
}
