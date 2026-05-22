import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientId, Invoice, InvoiceId, InvoiceNumber, LineItems, Money, VatRate, LineItem } from '@/lib/domain';
import { TotalsBox } from './TotalsBox';

function createInvoice(): Invoice {
  return Invoice.create({
    id: InvoiceId.fromString('018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a'),
    number: InvoiceNumber.of('SF2026-', 1),
    seriesId: 'default',
    clientId: ClientId.fromString('018fc3db-c5be-7f52-8789-982367dca12a'),
    issueDate: new Date('2026-05-22'),
    dueDate: new Date('2026-06-05'),
    lineItems: LineItems.empty().add(
      LineItem.of({
        id: 'line-1',
        description: 'Paslauga',
        quantity: 1,
        unit: 'vnt.',
        unitPrice: new Money(12.34),
        vatRate: VatRate.of(0),
      }),
    ),
    vat: { enabled: false, rate: VatRate.of(21) },
    status: 'draft',
    designPresetId: 'default',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('TotalsBox', () => {
  it('when rendering totals, then shows monetary totals only', () => {
    render(<TotalsBox invoice={createInvoice()} />);

    expect(screen.getByText('Iš viso:')).toBeInTheDocument();
    expect(screen.queryByText('Suma žodžiais:')).not.toBeInTheDocument();
  });
});
