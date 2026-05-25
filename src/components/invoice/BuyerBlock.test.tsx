import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BuyerBlock } from './BuyerBlock';
import { Client, ClientId, Invoice, InvoiceId, InvoiceNumber, LineItems, VatRate } from '@/lib/domain';

const mockUseClients = vi.fn();

vi.mock('@/hooks', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useClients: () => mockUseClients(),
  };
});

function createInvoice(clientId: ClientId): Invoice {
  return Invoice.create({
    id: InvoiceId.fromString('018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a'),
    number: InvoiceNumber.of('SF2026-', 1),
    seriesId: 'default',
    clientId,
    issueDate: new Date('2026-05-22'),
    dueDate: new Date('2026-06-05'),
    lineItems: LineItems.empty(),
    vat: { enabled: false, rate: VatRate.of(21) },
    status: 'draft',
    designPresetId: 'default',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('BuyerBlock', () => {
  const firstClient = Client.of({
    id: ClientId.fromString('018fc3db-c5be-7f52-8789-982367dca12a'),
    name: 'UAB Bandymai',
    address: 'Vilniaus g. 1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const secondClient = Client.of({
    id: ClientId.fromString('018fc3f0-c5be-7f52-8789-982367dca12b'),
    name: 'MB Kitas Klientas',
    address: 'Kauno g. 2',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClients.mockReturnValue({ clients: [firstClient, secondClient] });
  });

  it('when buyer is rendered, then shows client info without inline change action', () => {
    render(
      <BuyerBlock invoice={createInvoice(firstClient.id)} />,
    );

    expect(screen.getByText('UAB Bandymai')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pakeisti' })).not.toBeInTheDocument();
  });
});
