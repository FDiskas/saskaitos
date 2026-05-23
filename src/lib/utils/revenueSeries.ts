import { Money, type InvoiceSummary } from '@/lib/domain';

const MONTH_LABELS_LT = [
  'Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir',
  'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Gru',
] as const;

export interface RevenueBucket {
  label: string;
  amount: Money;
}

function isRevenue(summary: InvoiceSummary): boolean {
  return summary.status !== 'draft';
}

export function monthlyRevenue(summaries: InvoiceSummary[], year: number): RevenueBucket[] {
  const totals = Array.from({ length: 12 }, () => Money.zero());
  for (const s of summaries) {
    if (!isRevenue(s)) continue;
    if (!s.issuedInYear(year)) continue;
    const month = s.issueDate.getMonth();
    const current = totals[month];
    if (!current) continue;
    totals[month] = current.add(s.amount);
  }
  return totals.map((amount, idx) => ({ label: MONTH_LABELS_LT[idx] ?? '', amount }));
}

export function quarterlyRevenue(summaries: InvoiceSummary[], year: number): RevenueBucket[] {
  const totals = Array.from({ length: 4 }, () => Money.zero());
  for (const s of summaries) {
    if (!isRevenue(s)) continue;
    if (!s.issuedInYear(year)) continue;
    const quarter = Math.floor(s.issueDate.getMonth() / 3);
    const current = totals[quarter];
    if (!current) continue;
    totals[quarter] = current.add(s.amount);
  }
  return totals.map((amount, idx) => ({ label: `K${idx + 1}`, amount }));
}

export function annualRevenue(
  summaries: InvoiceSummary[],
  endYear: number,
  yearsBack: number,
): RevenueBucket[] {
  const startYear = endYear - yearsBack + 1;
  const totals = Array.from({ length: yearsBack }, () => Money.zero());
  for (const s of summaries) {
    if (!isRevenue(s)) continue;
    const idx = s.issueDate.getFullYear() - startYear;
    if (idx < 0 || idx >= yearsBack) continue;
    const current = totals[idx];
    if (!current) continue;
    totals[idx] = current.add(s.amount);
  }
  return totals.map((amount, idx) => ({ label: String(startYear + idx), amount }));
}
