import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TemplateBlockSettingsSidebar } from './TemplateBlockSettingsSidebar';
import type { TextBlockInstance } from '@/lib/invoice-template/layout';
import { ClientId, Invoice, InvoiceId, InvoiceNumber, LineItems, VatRate } from '@/lib/domain';

const mockUseCreateClient = vi.fn();
const mockFileToBase64 = vi.fn();

vi.mock('@/components/shared', () => ({
  ClientCombobox: ({ value, placeholder }: { value: string | null; placeholder?: string }) => (
    <div>
      <span>{placeholder ?? 'Pasirinkite klientą...'}</span>
      <span>{value}</span>
    </div>
  ),
  JarsCompanySearchButton: () => null,
}));

vi.mock('@/hooks', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useCreateClient: () => mockUseCreateClient(),
    useSettings: () => ({ settings: null, isLoading: false, isUpdating: false, error: null, update: vi.fn() }),
  };
});

vi.mock('@/lib/files', () => ({
  fileToBase64: (file: File) => mockFileToBase64(file),
}));

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

describe('TemplateBlockSettingsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockFileToBase64.mockResolvedValue('data:image/png;base64,mocked-logo');
  });

  it('when editing text control, then commits text change on blur only', () => {
    const onInstancePatch = vi.fn();

    render(
      <TemplateBlockSettingsSidebar
        invoice={createInvoice()}
        onInvoiceChange={vi.fn()}
        selectedInstance={createTextInstance('Labavakar')}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={onInstancePatch}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    const textArea = screen.getByPlaceholderText('Įveskite tekstą');

    fireEvent.focus(textArea);
    fireEvent.change(textArea, { target: { value: 'Laba vakara' } });

    expect(onInstancePatch).not.toHaveBeenCalledWith({ kind: 'text', text: 'Laba vakara' });

    fireEvent.blur(textArea);

    expect(onInstancePatch).toHaveBeenCalledWith({ kind: 'text', text: 'Laba vakara' });
  });

  it('when dragging top margin slider, then commits patch on mouse up only', () => {
    const onInstancePatch = vi.fn();

    render(
      <TemplateBlockSettingsSidebar
        invoice={createInvoice()}
        onInvoiceChange={vi.fn()}
        selectedInstance={{
          id: 'inst-notes',
          kind: 'notes',
          align: 'left',
          marginTop: 0,
          marginBottom: 0,
        }}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={onInstancePatch}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    const sliders = screen.getAllByRole('slider');
    const topMarginSlider = sliders[0] as HTMLInputElement;

    fireEvent.focus(topMarginSlider);
    fireEvent.change(topMarginSlider, { target: { value: '25' } });

    expect(onInstancePatch).not.toHaveBeenCalledWith({ marginTop: 25 });

    fireEvent.mouseUp(topMarginSlider);

    expect(onInstancePatch).toHaveBeenCalledWith({ marginTop: 25 });
  });

  it('when buyer block is selected, then shows client picker in block settings', () => {
    render(
      <TemplateBlockSettingsSidebar
        invoice={createInvoice()}
        onInvoiceChange={vi.fn()}
        selectedInstance={{
          id: 'inst-buyer',
          kind: 'buyer-info',
          align: 'left',
          marginTop: 0,
          marginBottom: 0,
        }}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={vi.fn()}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    expect(screen.getByText('Pirkėjo duomenys')).toBeInTheDocument();
    expect(screen.getByText('Klientas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pridėti klientą' })).toBeInTheDocument();
  });

  it('when clicking add client in buyer settings, then opens create client dialog', () => {
    render(
      <TemplateBlockSettingsSidebar
        invoice={createInvoice()}
        onInvoiceChange={vi.fn()}
        selectedInstance={{
          id: 'inst-buyer',
          kind: 'buyer-info',
          align: 'left',
          marginTop: 0,
          marginBottom: 0,
        }}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={vi.fn()}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pridėti klientą' }));

    expect(screen.getByText('Pridėti Klientą')).toBeInTheDocument();
  });

  it('when uploading logo in logo block settings, then updates company logo', async () => {
    const onLogoBase64Change = vi.fn();

    render(
      <TemplateBlockSettingsSidebar
        invoice={createInvoice()}
        onInvoiceChange={vi.fn()}
        logoBase64={undefined}
        onLogoBase64Change={onLogoBase64Change}
        selectedInstance={{
          id: 'inst-logo',
          kind: 'logo',
          align: 'left',
          marginTop: 0,
          marginBottom: 0,
        }}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={vi.fn()}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Įkelti logotipą');
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onLogoBase64Change).toHaveBeenCalledWith('data:image/png;base64,mocked-logo');
    });
  });
});
