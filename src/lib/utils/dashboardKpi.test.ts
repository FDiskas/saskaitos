import { describe, it, expect } from 'vitest';
import { computeKpi } from './dashboardKpi';
import { InvoiceSummary } from '@/lib/domain';
import { ClientId } from '@/lib/domain';
import { InvoiceId } from '@/lib/domain';
import { Money } from '@/lib/domain';
import type { InvoiceStatus } from '@/lib/domain';

function s(
  amountCents: number,
  status: InvoiceStatus,
  issueDate: Date,
  dueDate: Date,
): InvoiceSummary {
  return InvoiceSummary.of({
    id: InvoiceId.create(),
    number: 'X',
    clientId: ClientId.create(),
    clientName: 'C',
    issueDate,
    dueDate,
    amount: Money.fromCents(amountCents),
    status,
  });
}

describe('computeKpi', () => {
  it('when summaries empty, then all KPI are zero', () => {
    const today = new Date('2026-05-22');
    const k = computeKpi([], today);
    expect(k.issuedThisMonth.toCents()).toBe(0);
    expect(k.awaitingPayment.toCents()).toBe(0);
    expect(k.overdueCount).toBe(0);
    expect(k.paidYtd.toCents()).toBe(0);
  });

  it('when summaries cover several buckets, then KPI sum correctly', () => {
    const today = new Date('2026-05-22');
    const list = [
      s(10000, 'sent', new Date('2026-05-10'), new Date('2026-06-10')),
      s(20000, 'sent', new Date('2026-01-05'), new Date('2026-01-20')),
      s(30000, 'paid', new Date('2026-03-15'), new Date('2026-04-15')),
      s(40000, 'draft', new Date('2025-12-15'), new Date('2026-01-15')),
      s(50000, 'paid', new Date('2025-12-15'), new Date('2026-01-15')),
    ];

    const k = computeKpi(list, today);

    expect(k.issuedThisMonth.toCents()).toBe(10000);
    expect(k.awaitingPayment.toCents()).toBe(10000 + 20000);
    expect(k.overdueCount).toBe(1);
    expect(k.paidYtd.toCents()).toBe(30000);
  });

  it('when persisted status overdue, then counts toward awaiting + overdue', () => {
    const today = new Date('2026-05-22');
    const k = computeKpi(
      [s(15000, 'overdue', new Date('2026-01-10'), new Date('2026-02-10'))],
      today,
    );
    expect(k.awaitingPayment.toCents()).toBe(15000);
    expect(k.overdueCount).toBe(1);
  });
});
