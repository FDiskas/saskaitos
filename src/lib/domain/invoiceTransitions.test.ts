import { describe, it, expect } from 'vitest';
import { applyStatus } from './invoiceTransitions';
import { Invoice } from './Invoice';
import { InvoiceId } from './InvoiceId';
import { ClientId } from './ClientId';
import { InvoiceNumber } from './InvoiceNumber';
import { LineItems } from './LineItems';
import { VatRate } from './VatRate';

function baseInvoice() {
  return Invoice.create({
    id: InvoiceId.create(),
    number: InvoiceNumber.of('SF', 1),
    seriesId: 's',
    clientId: ClientId.create(),
    issueDate: new Date('2026-01-10'),
    dueDate: new Date('2026-02-10'),
    lineItems: LineItems.empty(),
    vat: { enabled: false, rate: VatRate.of(0) },
    status: 'draft',
    designPresetId: 'd',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('applyStatus', () => {
  it.each([
    ['draft', 'draft'],
    ['sent', 'sent'],
    ['paid', 'paid'],
    ['overdue', 'overdue'],
  ] as const)('when target %s, then invoice ends with %s status', (target, expected) => {
    const inv = applyStatus(baseInvoice(), target);
    expect(inv.status).toBe(expected);
  });

  it('when applied, then returns a new instance (immutability)', () => {
    const inv = baseInvoice();
    const next = applyStatus(inv, 'paid');
    expect(next).not.toBe(inv);
    expect(inv.status).toBe('draft');
  });
});
