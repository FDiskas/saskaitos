import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { exportInvoiceToXlsx } from './invoiceToXlsx';
import { Invoice, Client, InvoiceId, ClientId, InvoiceNumber, LineItem, LineItems, Money, VatRate } from '../domain';
import type { SettingsDto } from '../drive/settings';

type XlsxModule = typeof XLSX;

vi.mock('xlsx', async (importOriginal) => {
  const original = await importOriginal<XlsxModule>();
  return {
    ...original,
    writeFile: vi.fn(),
    utils: {
      ...original.utils,
      aoa_to_sheet: vi.fn((data) => data),
      book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
      book_append_sheet: vi.fn(),
    },
  };
});

function makeTestInvoice(): Invoice {
  return Invoice.create({
    id: InvoiceId.create(),
    number: InvoiceNumber.of('SF2026-', 123),
    seriesId: 'series-1',
    clientId: ClientId.create(),
    issueDate: new Date('2026-05-22'),
    dueDate: new Date('2026-06-22'),
    lineItems: LineItems.empty().add(
      LineItem.of({
        id: '1',
        description: 'Test paslauga',
        quantity: 5,
        unit: 'val.',
        unitPrice: new Money(100),
        vatRate: VatRate.of(21),
      })
    ),
    vat: { enabled: true, rate: VatRate.of(21) },
    designPresetId: 'default',
    createdAt: new Date('2026-05-22'),
    updatedAt: new Date('2026-05-22'),
  });
}

function makeTestClient(): Client {
  return Client.of({
    id: ClientId.create(),
    name: 'Pirkėjas UAB',
    code: '123456789',
    vatCode: 'LT123456789',
    address: 'Vilniaus g. 10, Vilnius',
    email: 'pirkejas@imone.lt',
    phone: '+37061111111',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const mockSettings: SettingsDto = {
  company: {
    name: 'UAB Pardavėjas',
    code: '987654321',
    vatCode: 'LT987654321',
    address: 'Kauno g. 20, Kaunas',
    iban: 'LT123456789012345678',
    bankName: 'Swedbank',
    email: 'info@pardavejas.lt',
    phone: '+37062222222',
  },
  companies: [
    {
      id: 'company-1',
      company: {
        name: 'UAB Pardavėjas',
        code: '987654321',
        vatCode: 'LT987654321',
        address: 'Kauno g. 20, Kaunas',
        iban: 'LT123456789012345678',
        bankName: 'Swedbank',
        email: 'info@pardavejas.lt',
        phone: '+37062222222',
      },
    },
  ],
  activeCompanyId: 'company-1',
  series: [],
  designPresets: [],
  invoiceLayout: {
    layout: [],
    blockSettings: {},
  },
};

describe('exportInvoiceToXlsx', () => {
  it('should compile the spreadsheet data correctly and trigger export', async () => {
    const invoice = makeTestInvoice();
    const client = makeTestClient();

    await exportInvoiceToXlsx(invoice, client, mockSettings);

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    const dataCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0]?.[0] as unknown[][];
    expect(dataCall).toBeDefined();

    // Check presence of key seller, buyer and item data in the spreadsheet rows
    const flatData = dataCall.flat().map(String);
    expect(flatData).toContain('UAB Pardavėjas');
    expect(flatData).toContain('Pirkėjas UAB');
    expect(flatData).toContain('Test paslauga');
    expect(flatData).toContain('PVM SĄSKAITA-FAKTŪRA');
    expect(flatData).toContain('Serija ir numeris: SF2026-0123');
    expect(flatData).toContain('Suma žodžiais');

    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      '2026-05-22_SF2026-0123.xlsx'
    );
  });
});
