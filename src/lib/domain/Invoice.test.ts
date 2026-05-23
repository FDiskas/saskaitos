import { describe, it, expect } from 'vitest';
import { Invoice } from './Invoice';
import { InvoiceId } from './InvoiceId';
import { ClientId } from './ClientId';
import { Discount } from './Discount';
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
        vatRate: VatRate.of(21),
      }),
    )
    .add(
      LineItem.of({
        id: 'b',
        description: 'Mokymai',
        quantity: 1,
        unit: 'vnt.',
        unitPrice: new Money(123.45),
        vatRate: VatRate.of(21),
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

    it('when line items have different VAT rates, then vat total is sum of each line VAT', () => {
      const inv = Invoice.create({
        id: InvoiceId.create(),
        number: InvoiceNumber.of('SF-', 2),
        seriesId: 's',
        clientId: ClientId.create(),
        issueDate: new Date('2026-05-22'),
        dueDate: new Date('2026-06-22'),
        lineItems: LineItems.of([
          LineItem.of({
            id: 'a',
            description: 'A',
            quantity: 1,
            unit: 'vnt.',
            unitPrice: new Money(100),
            vatRate: VatRate.of(21),
          }),
          LineItem.of({
            id: 'b',
            description: 'B',
            quantity: 1,
            unit: 'vnt.',
            unitPrice: new Money(100),
            vatRate: VatRate.of(5),
          }),
        ]),
        vat: { enabled: true, rate: VatRate.of(21) },
        designPresetId: 'd',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const totals = inv.totals();
      expect(totals.subtotal.toCents()).toBe(20000);
      expect(totals.vatAmount.toCents()).toBe(2600);
      expect(totals.total.toCents()).toBe(22600);
    });

    it('when discount 10% applied, then taxable=subtotal-discount and vat scales', () => {
      const inv = baseInvoice().withDiscount(Discount.percent(10));
      const t = inv.totals();
      // subtotal: 223.45; discount: 22.34 (223.45*0.10 → 22.345 → banker 22.34)
      expect(t.subtotal.toCents()).toBe(22345);
      expect(t.discountAmount.toCents()).toBe(2234);
      expect(t.taxableAmount.toCents()).toBe(20111);
      // vat: 20111 * 0.21 = 4223.31 → 4223
      expect(t.vatAmount.toCents()).toBe(4223);
      expect(t.total.toCents()).toBe(24334);
    });

    it('when fixed discount 5 EUR applied without VAT, then total = subtotal - 5', () => {
      const inv = baseInvoice().withVatDisabled().withDiscount(Discount.fixed(new Money(5)));
      const t = inv.totals();
      expect(t.discountAmount.toCents()).toBe(500);
      expect(t.taxableAmount.toCents()).toBe(21845);
      expect(t.vatAmount.isZero()).toBe(true);
      expect(t.total.toCents()).toBe(21845);
    });

    it('when no discount, then discountAmount zero and taxable=subtotal', () => {
      const t = baseInvoice().totals();
      expect(t.discountAmount.isZero()).toBe(true);
      expect(t.taxableAmount.equals(t.subtotal)).toBe(true);
    });

    it('when fixed discount exceeds subtotal, then capped and total non-negative', () => {
      const inv = baseInvoice().withVatDisabled().withDiscount(Discount.fixed(new Money(10000)));
      const t = inv.totals();
      expect(t.discountAmount.equals(t.subtotal)).toBe(true);
      expect(t.taxableAmount.isZero()).toBe(true);
      expect(t.total.isZero()).toBe(true);
    });

    it('when withDiscount, then returns new instance with discount', () => {
      const inv = baseInvoice();
      const discounted = inv.withDiscount(Discount.percent(10));
      expect(inv.discount.isZero()).toBe(true);
      expect(discounted.discount.kind).toBe('percent');
      expect(discounted).not.toBe(inv);
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
        vatRate: VatRate.of(21),
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

    it('when withVat applied, then every line item adopts the new rate', () => {
      const mixed = baseInvoice().withLineItems(
        baseInvoice().lineItems.update('a', { vatRate: VatRate.of(5) }),
      );
      expect(mixed.lineItems.get('a')?.vatRate.percent).toBe(5);

      const unified = mixed.withVat(VatRate.of(9));
      const rates = unified.lineItems.toArray().map((item) => item.vatRate.percent);
      expect(rates.every((p) => p === 9)).toBe(true);
      expect(unified.vat.rate.percent).toBe(9);
    });
  });

  describe('designOverride', () => {
    it('when withDesignOverride applied, then returns new instance with override', () => {
      const inv = baseInvoice();
      const modified = inv.withDesignOverride({ primaryColor: '#ff0000' });
      expect(inv.designOverride).toBeUndefined();
      expect(modified.designOverride?.primaryColor).toBe('#ff0000');
      expect(modified).not.toBe(inv);
    });

    it('when withDesignOverride called twice, then merges partial patches', () => {
      const inv = baseInvoice().withDesignOverride({ primaryColor: '#ff0000' });
      const merged = inv.withDesignOverride({ accentColor: '#00ff00' });
      expect(merged.designOverride?.primaryColor).toBe('#ff0000');
      expect(merged.designOverride?.accentColor).toBe('#00ff00');
    });

    it('when withDesignOverride passes undefined value, then clears that field', () => {
      const inv = baseInvoice().withDesignOverride({ primaryColor: '#ff0000', accentColor: '#00ff00' });
      const cleared = inv.withDesignOverride({ primaryColor: undefined });
      expect(cleared.designOverride?.primaryColor).toBeUndefined();
      expect(cleared.designOverride?.accentColor).toBe('#00ff00');
    });
  });

  describe('companyId', () => {
    it('when companyId provided in create props, then exposed via getter', () => {
      const inv = Invoice.create({
        id: InvoiceId.create(),
        number: InvoiceNumber.of('SF-', 1),
        seriesId: 's',
        clientId: ClientId.create(),
        issueDate: new Date('2026-05-22'),
        dueDate: new Date('2026-06-22'),
        lineItems: LineItems.empty(),
        vat: { enabled: false, rate: VatRate.of(21) },
        designPresetId: 'd',
        createdAt: new Date(),
        updatedAt: new Date(),
        companyId: 'company-abc',
      });
      expect(inv.companyId).toBe('company-abc');
    });

    it('when companyId omitted, then getter returns undefined', () => {
      expect(baseInvoice().companyId).toBeUndefined();
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
