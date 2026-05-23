import { describe, it, expect } from 'vitest';
import { filterSummaries } from './filterInvoices';
import { ClientId, InvoiceId, InvoiceSummary, Money } from '@/lib/domain';
import type { InvoiceStatus } from '@/lib/domain';

const clientA = ClientId.create();
const clientB = ClientId.create();

function s(args: {
  number?: string;
  clientId?: ClientId;
  clientName?: string;
  status?: InvoiceStatus;
  issueDate?: Date;
  dueDate?: Date;
  companyId?: string;
}): InvoiceSummary {
  return InvoiceSummary.of({
    id: InvoiceId.create(),
    number: args.number ?? 'SF2026-0001',
    clientId: args.clientId ?? clientA,
    clientName: args.clientName ?? 'UAB Testas',
    issueDate: args.issueDate ?? new Date('2026-05-10'),
    dueDate: args.dueDate ?? new Date('2026-06-10'),
    amount: Money.fromCents(10000),
    status: args.status ?? 'sent',
    companyId: args.companyId,
  });
}

const today = new Date('2026-05-22');

describe('filterSummaries', () => {
  it('when no filters set, then returns all', () => {
    const list = [s({}), s({})];
    expect(filterSummaries(list, {}, today)).toHaveLength(2);
  });

  it('when search matches number, then includes it', () => {
    const list = [s({ number: 'SF2026-0001' }), s({ number: 'INV-9' })];
    const r = filterSummaries(list, { search: 'inv' }, today);
    expect(r).toHaveLength(1);
    expect(r[0]?.number).toBe('INV-9');
  });

  it('when search matches client name case-insensitively, then includes', () => {
    const list = [s({ clientName: 'UAB Foo' }), s({ clientName: 'UAB Bar' })];
    const r = filterSummaries(list, { search: 'foo' }, today);
    expect(r).toHaveLength(1);
    expect(r[0]?.clientName).toBe('UAB Foo');
  });

  it('when clientId set, then only matching client', () => {
    const list = [s({ clientId: clientA }), s({ clientId: clientB })];
    const r = filterSummaries(list, { clientId: clientA }, today);
    expect(r).toHaveLength(1);
  });

  it('when statuses set, then only matching effective statuses', () => {
    const list = [
      s({ status: 'paid' }),
      s({ status: 'sent', dueDate: new Date('2026-01-01') }),
      s({ status: 'draft' }),
    ];
    const r = filterSummaries(list, { statuses: ['overdue'] }, today);
    expect(r).toHaveLength(1);
    expect(r[0]?.effectiveStatus(today)).toBe('overdue');
  });

  it('when dateFrom set, then excludes earlier issue dates', () => {
    const list = [
      s({ issueDate: new Date('2026-01-01') }),
      s({ issueDate: new Date('2026-05-10') }),
    ];
    const r = filterSummaries(list, { dateFrom: new Date('2026-02-01') }, today);
    expect(r).toHaveLength(1);
  });

  it('when dateTo set, then excludes later issue dates', () => {
    const list = [
      s({ issueDate: new Date('2026-04-30') }),
      s({ issueDate: new Date('2026-05-10') }),
    ];
    const r = filterSummaries(list, { dateTo: new Date('2026-05-01') }, today);
    expect(r).toHaveLength(1);
  });

  it('when filters combined, then all conditions required', () => {
    const list = [
      s({ clientId: clientA, status: 'sent', dueDate: new Date('2025-01-01') }),
      s({ clientId: clientA, status: 'paid' }),
      s({ clientId: clientB, status: 'sent', dueDate: new Date('2025-01-01') }),
    ];
    const r = filterSummaries(list, { clientId: clientA, statuses: ['overdue'] }, today);
    expect(r).toHaveLength(1);
  });

  it('when companyId set, then only summaries with same companyId pass', () => {
    const list = [
      s({ companyId: 'co-1' }),
      s({ companyId: 'co-2' }),
      s({ companyId: 'co-1' }),
    ];
    const r = filterSummaries(list, { companyId: 'co-1' }, today);
    expect(r).toHaveLength(2);
  });

  it('when companyId set and summary has no companyId, then excluded', () => {
    const list = [s({ companyId: undefined }), s({ companyId: 'co-1' })];
    const r = filterSummaries(list, { companyId: 'co-1' }, today);
    expect(r).toHaveLength(1);
  });

  it('when companyId filter null, then all pass regardless of companyId', () => {
    const list = [s({ companyId: 'co-1' }), s({ companyId: undefined })];
    expect(filterSummaries(list, { companyId: null }, today)).toHaveLength(2);
  });
});
