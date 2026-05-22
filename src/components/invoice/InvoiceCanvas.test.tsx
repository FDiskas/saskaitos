import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { InvoiceCanvas } from './InvoiceCanvas';
import { ClientId, Invoice, InvoiceId, InvoiceNumber, LineItems, VatRate } from '@/lib/domain';
import { defaultSettings } from '@/lib/drive/settings';

function createInvoice(): Invoice {
  return Invoice.create({
    id: InvoiceId.fromString('018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a'),
    number: InvoiceNumber.of('SF2026-', 1),
    seriesId: 'default',
    clientId: ClientId.fromString('018fc3db-c5be-7f52-8789-982367dca12a'),
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

describe('InvoiceCanvas', () => {
  it('when clicking empty single-column row placeholder, then selects row', () => {
    const onSelectRow = vi.fn();

    render(
      <DndContext>
        <InvoiceCanvas
          invoice={createInvoice()}
          onChange={vi.fn()}
          settings={defaultSettings()}
          layout={{
            layout: [
              {
                id: 'row-empty',
                type: 'row',
                columns: [{ id: 'col-empty', span: 1, content: [] }],
              },
            ],
          }}
          isPreview={false}
          onSelectInstance={vi.fn()}
          onSelectRow={onSelectRow}
        />
      </DndContext>,
    );

    fireEvent.click(screen.getByText('Įtempkite bloką čia'));

    expect(onSelectRow).toHaveBeenCalledWith('row-empty');
  });
});
