import { Money, type InvoiceSummary } from '@/lib/domain';

export interface DashboardKpi {
  issuedThisMonth: Money;
  awaitingPayment: Money;
  overdueCount: number;
  paidYtd: Money;
}

export function computeKpi(summaries: InvoiceSummary[], today: Date): DashboardKpi {
  const year = today.getFullYear();
  const month = today.getMonth();
  let issuedThisMonth = Money.zero();
  let awaitingPayment = Money.zero();
  let overdueCount = 0;
  let paidYtd = Money.zero();

  for (const s of summaries) {
    const effective = s.effectiveStatus(today);
    if (s.issuedInMonth(year, month)) {
      issuedThisMonth = issuedThisMonth.add(s.amount);
    }
    if (effective === 'sent' || effective === 'overdue') {
      awaitingPayment = awaitingPayment.add(s.amount);
    }
    if (effective === 'overdue') overdueCount += 1;
    if (effective === 'paid' && s.issuedInYear(year)) {
      paidYtd = paidYtd.add(s.amount);
    }
  }

  return { issuedThisMonth, awaitingPayment, overdueCount, paidYtd };
}
