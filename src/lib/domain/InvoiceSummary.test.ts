import { describe, it, expect } from 'vitest';
import { InvoiceSummary } from './InvoiceSummary';
import { ClientId } from './ClientId';
import { InvoiceId } from './InvoiceId';
import { Money } from './Money';

function makeSummary(overrides: Partial<{
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: Date;
  dueDate: Date;
  amountCents: number;
  clientName: string;
  number: string;
}> = {}): InvoiceSummary {
  return InvoiceSummary.of({
    id: InvoiceId.create(),
    number: overrides.number ?? 'SF2026-0001',
    clientId: ClientId.create(),
    clientName: overrides.clientName ?? 'UAB Testas',
    issueDate: overrides.issueDate ?? new Date('2026-01-15'),
    dueDate: overrides.dueDate ?? new Date('2026-02-15'),
    amount: Money.fromCents(overrides.amountCents ?? 12100),
    status: overrides.status ?? 'sent',
  });
}

describe('InvoiceSummary', () => {
  describe('effectiveStatus', () => {
    it('when status is sent and dueDate is past, then effective status is overdue', () => {
      const s = makeSummary({ status: 'sent', dueDate: new Date('2026-01-01') });
      expect(s.effectiveStatus(new Date('2026-05-22'))).toBe('overdue');
    });

    it('when status is sent and dueDate is future, then effective status stays sent', () => {
      const s = makeSummary({ status: 'sent', dueDate: new Date('2026-12-31') });
      expect(s.effectiveStatus(new Date('2026-05-22'))).toBe('sent');
    });

    it('when status is paid and dueDate is past, then effective status stays paid', () => {
      const s = makeSummary({ status: 'paid', dueDate: new Date('2026-01-01') });
      expect(s.effectiveStatus(new Date('2026-05-22'))).toBe('paid');
    });

    it('when status is draft, then never auto-overdue', () => {
      const s = makeSummary({ status: 'draft', dueDate: new Date('2026-01-01') });
      expect(s.effectiveStatus(new Date('2026-05-22'))).toBe('draft');
    });

    it('when persisted status is overdue, then stays overdue', () => {
      const s = makeSummary({ status: 'overdue' });
      expect(s.effectiveStatus(new Date('2026-05-22'))).toBe('overdue');
    });
  });

  describe('issuedInMonth', () => {
    it('when issueDate matches month and year, then true', () => {
      const s = makeSummary({ issueDate: new Date('2026-05-15') });
      expect(s.issuedInMonth(2026, 4)).toBe(true);
    });

    it('when different month, then false', () => {
      const s = makeSummary({ issueDate: new Date('2026-04-30') });
      expect(s.issuedInMonth(2026, 4)).toBe(false);
    });
  });

  describe('issuedInYear', () => {
    it('when same year, then true', () => {
      const s = makeSummary({ issueDate: new Date('2026-11-30') });
      expect(s.issuedInYear(2026)).toBe(true);
    });

    it('when different year, then false', () => {
      const s = makeSummary({ issueDate: new Date('2025-11-30') });
      expect(s.issuedInYear(2026)).toBe(false);
    });
  });
});
