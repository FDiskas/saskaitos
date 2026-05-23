import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceEditorPage } from './invoice-editor';
import { Invoice, InvoiceId, InvoiceNumber, LineItems, VatRate, ClientId, Client } from '@/lib/domain';

// Mock Router Params
const mockParams = { id: 'new' };
const mockSearch = { clientId: undefined as string | undefined };
vi.mock('@tanstack/react-router', () => ({
  useParams: () => mockParams,
  useSearch: () => mockSearch,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock Hooks
const mockUseInvoice = vi.fn();
const mockUseCreateInvoice = vi.fn();
const mockUseUpdateInvoice = vi.fn();
const mockUseSettings = vi.fn();
const mockUseClients = vi.fn();
const mockUseCreateClient = vi.fn();
const mockUploadBinary = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/pdf', () => ({
  generateInvoicePdfBlob: vi.fn().mockResolvedValue(
    new Blob(['pdf content'], { type: 'application/pdf' }),
  ),
}));

vi.mock('@/hooks', () => ({
  useInvoice: (id: string) => mockUseInvoice(id),
  useCreateInvoice: () => mockUseCreateInvoice(),
  useUpdateInvoice: () => mockUseUpdateInvoice(),
  useSettings: () => mockUseSettings(),
  useClients: () => mockUseClients(),
  useCreateClient: () => mockUseCreateClient(),
  useStorage: () => ({
    uploadBinary: mockUploadBinary,
  }),
  useInvoiceAutosave: () => false,
  getInvoicePdfPath: vi.fn().mockReturnValue('mocked-pdf-path.pdf'),
  useGoogleFontInBrowser: () => undefined,
}));

// Mock window.print and URL
const originalPrint = window.print;
const originalCreateObjectURL = window.URL.createObjectURL;
const originalRevokeObjectURL = window.URL.revokeObjectURL;

beforeEach(() => {
  window.print = vi.fn();
  window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
  window.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  window.print = originalPrint;
  window.URL.createObjectURL = originalCreateObjectURL;
  window.URL.revokeObjectURL = originalRevokeObjectURL;
});

describe('InvoiceEditorPage', () => {
  const dummyClients = [
    Client.of({
      id: ClientId.fromString('018fc3db-c5be-7f52-8789-982367dca12a'),
      name: 'UAB Bandymai',
      address: 'Vilniaus g. 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ];

  const dummySettings = {
    company: {
      name: 'Mano Įmonė',
      code: '123456789',
      address: 'Kauno g. 2',
      iban: 'LT123456789',
      bankName: 'Swedbank',
      email: 'info@mano.lt',
      phone: '+37060000000',
    },
    series: [
      { id: 'default', prefix: 'SF2026-', nextNumber: 1, isDefault: true }
    ],
    designPresets: [
      {
        id: 'default',
        name: 'Numatytasis',
        primaryColor: '#0f172a',
        accentColor: '#2563eb',
        fontFamily: 'Inter',
      }
    ],
    invoiceLayout: {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            { id: 'col-1-1', span: 1, content: [{ id: 'inst-seller', kind: 'seller-info', align: 'left', marginTop: 0, marginBottom: 0 }] },
            { id: 'col-1-2', span: 1, content: [{ id: 'inst-meta', kind: 'invoice-meta', align: 'left', marginTop: 0, marginBottom: 0 }] },
          ],
        },
        {
          id: 'row-2',
          type: 'row',
          columns: [{ id: 'col-2-1', span: 1, content: [{ id: 'inst-buyer', kind: 'buyer-info', align: 'left', marginTop: 0, marginBottom: 0 }] }],
        },
        {
          id: 'row-3',
          type: 'row',
          columns: [{ id: 'col-3-1', span: 1, content: [{ id: 'inst-items', kind: 'line-items', align: 'left', marginTop: 0, marginBottom: 0 }] }],
        },
        {
          id: 'row-4',
          type: 'row',
          columns: [
            { id: 'col-4-1', span: 1, content: [{ id: 'inst-notes', kind: 'notes', align: 'left', marginTop: 0, marginBottom: 0 }] },
            { id: 'col-4-2', span: 1, content: [{ id: 'inst-totals', kind: 'totals', align: 'left', marginTop: 0, marginBottom: 0 }] },
          ],
        },
        {
          id: 'row-5',
          type: 'row',
          columns: [{ id: 'col-5-1', span: 1, content: [{ id: 'inst-sig', kind: 'signature', align: 'left', marginTop: 0, marginBottom: 0 }] }],
        },
      ],
    },
  };

  const dummyInvoice = Invoice.create({
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.clientId = undefined;

    mockUseSettings.mockReturnValue({
      settings: dummySettings,
      isLoading: false,
      update: vi.fn(),
    });

    mockUseClients.mockReturnValue({
      clients: dummyClients,
      isLoading: false,
    });

    mockUseCreateInvoice.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mockUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mockUseUpdateInvoice.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders loading state when data is fetching', () => {
    mockUseInvoice.mockReturnValue({
      invoice: null,
      isLoading: true,
    });

    render(<InvoiceEditorPage />);
    expect(screen.getByText(/Kraunami redaktoriaus duomenys.../)).toBeInTheDocument();
  });

  it('renders client select form when id is "new"', () => {
    mockParams.id = 'new';
    mockUseInvoice.mockReturnValue({
      invoice: null,
      isLoading: false,
    });

    render(<InvoiceEditorPage />);
    expect(screen.getByText(/Pasirinkite klientą, kuriam norite išrašyti naują sąskaitą/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pasirinkite iš sąrašo.../ })).toBeInTheDocument();
  });

  it('triggers creation mutation when client is chosen in "new" mode', async () => {
    mockParams.id = 'new';
    mockUseInvoice.mockReturnValue({
      invoice: null,
      isLoading: false,
    });
    const mutateSpy = vi.fn();
    mockUseCreateInvoice.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    });

    render(<InvoiceEditorPage />);

    // Open combobox
    const trigger = screen.getByRole('button', { name: /Pasirinkite iš sąrašo.../ });
    fireEvent.click(trigger);

    // Click on UAB Bandymai option
    const option = screen.getByText('UAB Bandymai');
    fireEvent.click(option);

    expect(mutateSpy).toHaveBeenCalledWith(dummyClients[0]!.id);
  });

  it('renders full invoice canvas and sidebar when invoice is loaded', () => {
    mockParams.id = '018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a';
    mockUseInvoice.mockReturnValue({
      invoice: dummyInvoice,
      isLoading: false,
    });

    render(<InvoiceEditorPage />);

    // Sidebar design templates section
    expect(screen.getByText('Dizaino šablonas')).toBeInTheDocument();

    // Canvas Seller section
    expect(screen.getByText('Mano Įmonė')).toBeInTheDocument();
    expect(screen.getByText('Įmonės kodas: 123456789')).toBeInTheDocument();

    // Canvas Buyer section
    expect(screen.getByText('UAB Bandymai')).toBeInTheDocument();

    // Canvas Totals
    expect(screen.getByText('Tarpinė suma:')).toBeInTheDocument();
    expect(screen.getAllByText('0,00 €').length).toBeGreaterThanOrEqual(2);
  });

  it('triggers PDF download and background upload on button click', async () => {
    mockParams.id = '018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a';
    mockUseInvoice.mockReturnValue({
      invoice: dummyInvoice,
      isLoading: false,
    });

    render(<InvoiceEditorPage />);

    const downloadButton = screen.getByRole('button', { name: /Atsisiųsti PDF/ });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(mockUploadBinary).toHaveBeenCalled();
    });
  });

  it('automatically triggers creation mutation when clientId search param is provided', () => {
    mockParams.id = 'new';
    mockSearch.clientId = '018fc3db-c5be-7f52-8789-982367dca12a';
    mockUseInvoice.mockReturnValue({
      invoice: null,
      isLoading: false,
    });
    const mutateSpy = vi.fn();
    mockUseCreateInvoice.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    });

    render(<InvoiceEditorPage />);

    expect(mutateSpy).toHaveBeenCalledWith(dummyClients[0]!.id);
  });

  it('when pressing space in notes textarea, then key event is not canceled', () => {
    mockParams.id = '018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a';
    mockUseInvoice.mockReturnValue({
      invoice: dummyInvoice,
      isLoading: false,
    });

    render(<InvoiceEditorPage />);

    fireEvent.click(screen.getByText('Pridėti papildomų pastabų...'));
    const notesTextarea = screen.getByRole('textbox');

    const wasNotCanceled = fireEvent.keyDown(notesTextarea, {
      key: ' ',
      code: 'Space',
      charCode: 32,
    });

    expect(wasNotCanceled).toBe(true);
  });

  it('when pressing space in custom text block textarea, then key event is not canceled', () => {
    mockParams.id = '018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a';
    mockUseInvoice.mockReturnValue({
      invoice: dummyInvoice,
      isLoading: false,
    });

    mockUseSettings.mockReturnValue({
      settings: {
        ...dummySettings,
        invoiceLayout: {
          layout: [
            ...dummySettings.invoiceLayout.layout,
            {
              id: 'row-text',
              type: 'row',
              columns: [
                {
                  id: 'col-text',
                  span: 1,
                  content: [
                    {
                      id: 'inst-text',
                      kind: 'text',
                      text: '',
                      fontSize: 14,
                      fontWeight: 'normal',
                      textColor: '#111111',
                      align: 'left',
                      marginTop: 0,
                      marginBottom: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      isLoading: false,
      update: vi.fn(),
    });

    render(<InvoiceEditorPage />);

    const textBlockTextarea = screen.getByPlaceholderText('Įveskite tekstą');
    const wasNotCanceled = fireEvent.keyDown(textBlockTextarea, {
      key: ' ',
      code: 'Space',
      charCode: 32,
    });

    expect(wasNotCanceled).toBe(true);
  });

  it('when inserting space in middle of text block, then caret stays after inserted space', async () => {
    const user = userEvent.setup();
    mockParams.id = '018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a';
    mockUseInvoice.mockReturnValue({
      invoice: dummyInvoice,
      isLoading: false,
    });

    mockUseSettings.mockReturnValue({
      settings: {
        ...dummySettings,
        invoiceLayout: {
          layout: [
            {
              id: 'row-text-only',
              type: 'row',
              columns: [
                {
                  id: 'col-text-only',
                  span: 1,
                  content: [
                    {
                      id: 'inst-text-only',
                      kind: 'text',
                      text: 'Labavakar',
                      fontSize: 14,
                      fontWeight: 'normal',
                      textColor: '#111111',
                      align: 'left',
                      marginTop: 0,
                      marginBottom: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      isLoading: false,
      update: vi.fn(),
    });

    render(<InvoiceEditorPage />);

    const textBlockTextarea = screen.getByPlaceholderText('Įveskite tekstą') as HTMLTextAreaElement;
    textBlockTextarea.focus();
    textBlockTextarea.setSelectionRange(4, 4);

    await user.keyboard(' ');

    expect(textBlockTextarea.selectionStart).toBe(5);
    expect(textBlockTextarea.selectionEnd).toBe(5);
  });
});
