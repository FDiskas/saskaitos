import { describe, it, expect } from 'vitest';
import { Invoice } from './Invoice';
import { InvoiceId } from './InvoiceId';
import { ClientId } from './ClientId';
import { InvoiceNumber } from './InvoiceNumber';
import { LineItem } from './LineItem';
import { LineItems } from './LineItems';
import { Money } from './Money';
import { VatRate } from './VatRate';

function makeItems(): LineItems {
  return LineItems.empty()
    .add(
      LineItem.of({
        id: 'a',
        description: 'Konsultacijos',
        quantity: 2,
        unit: 'val.',
        unitPrice: new Money(50),
      }),
    )
    .add(
      LineItem.of({
        id: 'b',
        description: 'Mokymai',
        quantity: 1,
        unit: 'vnt.',
        unitPrice: new Money(123.45),
      }),
    );
}

function baseInvoice(): Invoice {
  return Invoice.create({
    id: InvoiceId.create(),
    number: InvoiceNumber.of('SF2026-', 1),
    seriesId: 'series-1',
    clientId: ClientId.create(),
    issueDate: new Date('2026-05-22'),
    dueDate: new Date('2026-06-22'),
    lineItems: makeItems(),
    vat: { enabled: true, rate: VatRate.of(21) },
    designPresetId: 'default',
    createdAt: new Date('2026-05-22'),
    updatedAt: new Date('2026-05-22'),
  });
}

describe('Invoice', () => {
  describe('totals', () => {
    it('when VAT enabled at 21%, then subtotal+vat+total computed correctly', () => {
      const inv = baseInvoice();
      const t = inv.totals();
      // subtotal: 2*50 + 123.45 = 223.45
      expect(t.subtotal.toCents()).toBe(22345);
      // vat = 223.45 * 0.21 = 46.9245 → 46.92 (bankers: 92 even)
      expect(t.vatAmount.toCents()).toBe(4692);
      // total: 270.37
      expect(t.total.toCents()).toBe(27037);
    });

    it('when VAT disabled, then vatAmount zero and total = subtotal', () => {
      const inv = baseInvoice().withVatDisabled();
      const t = inv.totals();
      expect(t.vatAmount.isZero()).toBe(true);
      expect(t.total.equals(t.subtotal)).toBe(true);
    });

    it('when empty line items, then all totals zero', () => {
      const inv = Invoice.create({
        id: InvoiceId.create(),
        number: InvoiceNumber.of('SF-', 1),
        seriesId: 's',
        clientId: ClientId.create(),
        issueDate: new Date('2026-05-22'),
        dueDate: new Date('2026-06-22'),
        lineItems: LineItems.empty(),
        vat: { enabled: true, rate: VatRate.of(21) },
        designPresetId: 'd',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const t = inv.totals();
      expect(t.subtotal.isZero()).toBe(true);
      expect(t.vatAmount.isZero()).toBe(true);
      expect(t.total.isZero()).toBe(true);
    });
  });

  describe('status transitions', () => {
    it('when created, then status is draft', () => {
      expect(baseInvoice().status).toBe('draft');
    });

    it('when markSent, then status is sent and original unchanged', () => {
      const inv = baseInvoice();
      const sent = inv.markSent();
      expect(inv.status).toBe('draft');
      expect(sent.status).toBe('sent');
      expect(sent).not.toBe(inv);
    });

    it('when markPaid, then status is paid', () => {
      expect(baseInvoice().markPaid().status).toBe('paid');
    });

    it('when markOverdue, then status is overdue', () => {
      expect(baseInvoice().markSent().markOverdue().status).toBe('overdue');
    });
  });

  describe('line item mutations (immutable)', () => {
    it('when withLineItem, then count increments and original unchanged', () => {
      const inv = baseInvoice();
      const newItem = LineItem.of({
        id: 'c',
        description: 'X',
        quantity: 1,
        unit: 'vnt.',
        unitPrice: new Money(10),
      });
      const modified = inv.withLineItem(newItem);
      expect(modified.lineItems.count()).toBe(3);
      expect(inv.lineItems.count()).toBe(2);
    });

    it('when withoutLineItem, then specified id removed', () => {
      const inv = baseInvoice();
      const modified = inv.withoutLineItem('a');
      expect(modified.lineItems.get('a')).toBeUndefined();
      expect(inv.lineItems.get('a')).toBeDefined();
    });

    it('when withVat changes rate, then totals reflect new rate', () => {
      const inv = baseInvoice();
      const at9 = inv.withVat(VatRate.of(9));
      expect(at9.totals().vatAmount.toCents()).not.toBe(inv.totals().vatAmount.toCents());
      expect(inv.totals().vatAmount.toCents()).toBe(4692);
    });
  });

  describe('isOverdue', () => {
    it('when today < dueDate, then false', () => {
      const inv = baseInvoice().markSent();
      expect(inv.isOverdue(new Date('2026-06-01'))).toBe(false);
    });

    it('when today > dueDate and status sent, then true', () => {
      const inv = baseInvoice().markSent();
      expect(inv.isOverdue(new Date('2026-07-01'))).toBe(true);
    });

    it('when status paid, then never overdue', () => {
      const inv = baseInvoice().markPaid();
      expect(inv.isOverdue(new Date('2099-01-01'))).toBe(false);
    });

    it('when status draft, then never overdue', () => {
      expect(baseInvoice().isOverdue(new Date('2099-01-01'))).toBe(false);
    });
  });
});
