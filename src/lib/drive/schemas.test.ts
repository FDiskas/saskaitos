import { describe, it, expect } from 'vitest';
import {
  Client,
  ClientId,
  Invoice,
  InvoiceId,
  InvoiceNumber,
  LineItem,
  LineItems,
  Money,
  Series,
  VatRate,
} from '@/lib/domain';
import {
  InvoiceDtoSchema,
  ClientDtoSchema,
  SeriesDtoSchema,
  invoiceToDto,
  invoiceFromDto,
  clientToDto,
  clientFromDto,
  seriesToDto,
  seriesFromDto,
} from './schemas';

function sampleInvoice(): Invoice {
  return Invoice.create({
    id: InvoiceId.create(),
    number: InvoiceNumber.of('SF2026-', 7),
    seriesId: 'series-x',
    clientId: ClientId.create(),
    issueDate: new Date('2026-05-22T00:00:00.000Z'),
    dueDate: new Date('2026-06-22T00:00:00.000Z'),
    lineItems: LineItems.empty().add(
      LineItem.of({
        id: 'a',
        description: 'Konsultacijos',
        quantity: 2,
        unit: 'val.',
        unitPrice: new Money(99.99),
        vatRate: VatRate.of(21),
      }),
    ),
    vat: { enabled: true, rate: VatRate.of(21) },
    notes: 'Pastaba',
    designPresetId: 'default',
    createdAt: new Date('2026-05-22T00:00:00.000Z'),
    updatedAt: new Date('2026-05-22T00:00:00.000Z'),
  });
}

describe('Invoice schema', () => {
  it('when serialized to DTO, then matches schema', () => {
    const dto = invoiceToDto(sampleInvoice());
    expect(() => InvoiceDtoSchema.parse(dto)).not.toThrow();
  });

  it('when roundtripped via DTO, then domain values preserved', () => {
    const original = sampleInvoice();
    const restored = invoiceFromDto(InvoiceDtoSchema.parse(invoiceToDto(original)));
    expect(restored.id.toString()).toBe(original.id.toString());
    expect(restored.number.toString()).toBe(original.number.toString());
    expect(restored.totals().total.equals(original.totals().total)).toBe(true);
    expect(restored.lineItems.count()).toBe(1);
    expect(restored.notes).toBe('Pastaba');
  });

  it('when DTO has invalid VAT rate, then parse throws', () => {
    expect(() =>
      InvoiceDtoSchema.parse({ ...invoiceToDto(sampleInvoice()), vat: { enabled: true, rate: 13 } }),
    ).toThrow();
  });
});

describe('Client schema', () => {
  it('when roundtripped, then values preserved', () => {
    const c = Client.of({
      id: ClientId.create(),
      name: 'UAB Testas',
      address: 'Vilnius',
      email: 'a@b.lt',
      createdAt: new Date('2026-05-22T00:00:00.000Z'),
      updatedAt: new Date('2026-05-22T00:00:00.000Z'),
    });
    const restored = clientFromDto(ClientDtoSchema.parse(clientToDto(c)));
    expect(restored.name).toBe('UAB Testas');
    expect(restored.email).toBe('a@b.lt');
  });
});

describe('Series schema', () => {
  it('when roundtripped, then values preserved', () => {
    const s = Series.of({ id: 's1', prefix: 'INV-', nextNumber: 42, isDefault: true });
    const restored = seriesFromDto(SeriesDtoSchema.parse(seriesToDto(s)));
    expect(restored.id).toBe('s1');
    expect(restored.nextNumber).toBe(42);
    expect(restored.isDefault).toBe(true);
  });
});
