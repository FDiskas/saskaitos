import { describe, it, expect } from 'vitest';
import { annualRevenue, monthlyRevenue, quarterlyRevenue } from './revenueSeries';
import { ClientId, InvoiceId, InvoiceSummary, Money } from '@/lib/domain';
import type { InvoiceStatus } from '@/lib/domain';

function s(amountCents: number, status: InvoiceStatus, issueDate: Date): InvoiceSummary {
  return InvoiceSummary.of({
    id: InvoiceId.create(),
    number: 'X',
    clientId: ClientId.create(),
    clientName: 'C',
    issueDate,
    dueDate: issueDate,
    amount: Money.fromCents(amountCents),
    status,
  });
}

describe('monthlyRevenue', () => {
  it('when no summaries, then returns 12 zero buckets', () => {
    const buckets = monthlyRevenue([], 2026);
    expect(buckets).toHaveLength(12);
    expect(buckets.every((b) => b.amount.isZero())).toBe(true);
  });

  it('when summaries spread across months, then sums per month', () => {
    const list = [
      s(10000, 'sent', new Date(2026, 0, 5)),
      s(20000, 'paid', new Date(2026, 0, 28)),
      s(30000, 'sent', new Date(2026, 4, 10)),
      s(40000, 'sent', new Date(2025, 4, 10)),
    ];
    const buckets = monthlyRevenue(list, 2026);
    expect(buckets[0]?.amount.toCents()).toBe(30000);
    expect(buckets[4]?.amount.toCents()).toBe(30000);
    expect(buckets[1]?.amount.toCents()).toBe(0);
  });

  it('when summary is draft, then it is excluded from revenue', () => {
    const list = [
      s(10000, 'draft', new Date(2026, 0, 5)),
      s(20000, 'sent', new Date(2026, 0, 5)),
    ];
    const buckets = monthlyRevenue(list, 2026);
    expect(buckets[0]?.amount.toCents()).toBe(20000);
  });
});

describe('quarterlyRevenue', () => {
  it('when summaries cover several quarters, then sums per quarter', () => {
    const list = [
      s(10000, 'sent', new Date(2026, 0, 15)),
      s(20000, 'sent', new Date(2026, 2, 31)),
      s(30000, 'sent', new Date(2026, 3, 1)),
      s(40000, 'sent', new Date(2026, 11, 31)),
    ];
    const buckets = quarterlyRevenue(list, 2026);
    expect(buckets).toHaveLength(4);
    expect(buckets[0]?.amount.toCents()).toBe(30000);
    expect(buckets[1]?.amount.toCents()).toBe(30000);
    expect(buckets[2]?.amount.toCents()).toBe(0);
    expect(buckets[3]?.amount.toCents()).toBe(40000);
  });

  it('when summary year differs, then excluded', () => {
    const list = [s(10000, 'sent', new Date(2025, 0, 15))];
    const buckets = quarterlyRevenue(list, 2026);
    expect(buckets.every((b) => b.amount.isZero())).toBe(true);
  });
});

describe('annualRevenue', () => {
  it('when yearsBack is 4 and endYear 2026, then returns buckets for 2023-2026', () => {
    const list = [
      s(10000, 'sent', new Date(2023, 5, 1)),
      s(20000, 'paid', new Date(2025, 5, 1)),
      s(30000, 'sent', new Date(2026, 5, 1)),
      s(99999, 'sent', new Date(2020, 5, 1)),
    ];
    const buckets = annualRevenue(list, 2026, 4);
    expect(buckets).toHaveLength(4);
    expect(buckets[0]?.label).toBe('2023');
    expect(buckets[0]?.amount.toCents()).toBe(10000);
    expect(buckets[1]?.amount.toCents()).toBe(0);
    expect(buckets[2]?.amount.toCents()).toBe(20000);
    expect(buckets[3]?.amount.toCents()).toBe(30000);
  });

  it('when summaries empty, then all annual buckets zero', () => {
    const buckets = annualRevenue([], 2026, 3);
    expect(buckets).toHaveLength(3);
    expect(buckets.every((b) => b.amount.isZero())).toBe(true);
  });
});
