import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClientId, Invoice, InvoiceId, InvoiceNumber, LineItems, VatRate } from '@/lib/domain';
import { defaultSettings } from '@/lib/drive/settings';
import {
  type BlockInstance,
  type BlockKind,
  type TextBlockInstance,
} from '@/lib/invoice-template/layout';
import {
  DATA_BLOCK_DEFINITIONS,
  DECOR_BLOCK_DEFINITIONS,
} from '@/lib/invoice-template/blocks';
import {
  INSTANCE_RENDERERS,
  type InstanceRenderContext,
  renderBlockInstanceContent,
} from './instanceContentRenderers';

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

function createContext(): InstanceRenderContext {
  return {
    invoice: createInvoice(),
    onChange: () => {},
    settings: defaultSettings(),
    palette: {
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      textColor: '#0f172a',
      mutedColor: '#64748b',
      borderColor: '#cbd5e1',
      headingColor: '#94a3b8',
    },
    isPreview: false,
    onInstancePatch: undefined,
  };
}

function createTextInstance(text: string): TextBlockInstance {
  return {
    id: 'inst-text',
    kind: 'text',
    text,
    fontSize: 14,
    fontWeight: 'normal',
    align: 'left',
    marginTop: 0,
    marginBottom: 0,
    textColor: '#111111',
  };
}

describe('instanceContentRenderers', () => {
  it('when registering renderers, then every block kind has renderer mapping', () => {
    const definedKinds = [
      ...DATA_BLOCK_DEFINITIONS.map((definition) => definition.kind),
      ...DECOR_BLOCK_DEFINITIONS.map((definition) => definition.kind),
    ].sort();

    const rendererKinds = (Object.keys(INSTANCE_RENDERERS) as BlockKind[]).sort();

    expect(rendererKinds).toEqual(definedKinds);
  });

  it('when editing text instance, then patch is committed on blur', () => {
    const onPatch: (instanceId: string, patch: Partial<BlockInstance>) => void = vi.fn();
    const context = createContext();
    context.onInstancePatch = onPatch;

    render(renderBlockInstanceContent(createTextInstance('Labavakar'), context));

    const textArea = screen.getByPlaceholderText('Įveskite tekstą');
    fireEvent.focus(textArea);
    fireEvent.change(textArea, { target: { value: 'Laba vakara' } });

    expect(onPatch).not.toHaveBeenCalledWith('inst-text', { kind: 'text', text: 'Laba vakara' });

    fireEvent.blur(textArea);

    expect(onPatch).toHaveBeenCalledWith('inst-text', { kind: 'text', text: 'Laba vakara' });
  });

  it('when rendering amount-in-words block, then it shows calculated amount in words', () => {
    const context = createContext();

    render(
      renderBlockInstanceContent(
        {
          id: 'inst-amount-words',
          kind: 'amount-in-words',
          align: 'left',
          marginTop: 0,
          marginBottom: 0,
        },
        context,
      ),
    );

    expect(screen.getByText('Suma žodžiais:')).toBeInTheDocument();
    expect(screen.getByText('Nulis eurų nulis centų')).toBeInTheDocument();
  });
});
