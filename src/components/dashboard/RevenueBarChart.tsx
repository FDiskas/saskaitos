import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import type { RevenueBucket } from '@/lib/utils/revenueSeries';
import { Money } from '@/lib/domain';

export interface RevenueBarChartProps {
  title: string;
  buckets: RevenueBucket[];
}

const CHART_HEIGHT = 140;
const MIN_BAR_PX = 2;

function pickMax(buckets: RevenueBucket[]): number {
  let max = 0;
  for (const b of buckets) {
    const cents = b.amount.toCents();
    if (cents > max) max = cents;
  }
  return max;
}

function barHeight(amount: Money, maxCents: number): number {
  if (maxCents <= 0) return 0;
  const ratio = amount.toCents() / maxCents;
  return Math.max(MIN_BAR_PX, Math.round(ratio * CHART_HEIGHT));
}

function formatCompact(amount: Money): string {
  const value = amount.toNumber();
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

export function RevenueBarChart({ title, buckets }: RevenueBarChartProps) {
  const maxCents = pickMax(buckets);
  const total = buckets.reduce((acc, b) => acc.add(b.amount), Money.zero());

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span className="text-sm font-semibold text-slate-900">{total.format()}</span>
      </CardHeader>
      <CardBody>
        <div
          className="flex items-end gap-2"
          style={{ height: `${CHART_HEIGHT}px` }}
          role="img"
          aria-label={title}
        >
          {buckets.map((b) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] text-slate-500">{formatCompact(b.amount)}</span>
              <div
                className="w-full rounded-t bg-emerald-500/80 transition-colors hover:bg-emerald-600"
                style={{ height: `${barHeight(b.amount, maxCents)}px` }}
                title={`${b.label}: ${b.amount.format()}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {buckets.map((b) => (
            <div key={b.label} className="flex-1 text-center text-xs text-slate-500">
              {b.label}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
