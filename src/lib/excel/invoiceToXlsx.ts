import * as XLSX from 'xlsx';
import { Invoice, Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import { formatDate } from '@/lib/format/date';

function getSellerRows(settings: SettingsDto): string[][] {
  const comp = settings.company;
  if (!comp) return [['Pardavėjo duomenys nenustatyti']];
  return [
    ['PARDAVĖJAS'],
    [comp.name],
    [`Įmonės kodas: ${comp.code}`],
    [comp.vatCode ? `PVM kodas: ${comp.vatCode}` : ''],
    [comp.address],
    [`IBAN: ${comp.iban}`],
    [`Bankas: ${comp.bankName}`],
    [`El. paštas: ${comp.email}`],
    [`Tel.: ${comp.phone}`],
  ].filter(row => row[0] !== '');
}

function getBuyerRows(client: Client): string[][] {
  return [
    ['PIRKĖJAS'],
    [client.name],
    [client.code ? `Įmonės kodas: ${client.code}` : ''],
    [client.vatCode ? `PVM kodas: ${client.vatCode}` : ''],
    [client.address],
    [client.email ? `El. paštas: ${client.email}` : ''],
    [client.phone ? `Tel.: ${client.phone}` : ''],
  ].filter(row => row[0] !== '');
}

function getInvoiceInfoRows(invoice: Invoice): string[][] {
  const title = invoice.vat.enabled ? 'PVM SĄSKAITA-FAKTŪRA' : 'SĄSKAITA-FAKTŪRA';
  return [
    [title],
    [`Serija ir numeris: ${invoice.number.toString()}`],
    [`Išrašymo data: ${formatDate(invoice.issueDate)}`],
    [`Apmokėti iki: ${formatDate(invoice.dueDate)}`],
  ];
}

function getItemRows(invoice: Invoice): (string | number)[][] {
  const header = [['Eil. Nr.', 'Aprašymas', 'Kiekis', 'Mato vnt.', 'Kaina', 'Suma']];
  const items = invoice.lineItems.toArray().map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    item.unit,
    item.unitPrice.toNumber(),
    item.total().toNumber(),
  ]);
  return [...header, ...items];
}

function getSummaryRows(invoice: Invoice): (string | number)[][] {
  const totals = invoice.totals();
  const rows: (string | number)[][] = [
    ['Tarpinė suma', '', '', '', '', totals.subtotal.toNumber()],
  ];
  if (invoice.vat.enabled) {
    rows.push([`PVM (${invoice.vat.rate.percent}%)`, '', '', '', '', totals.vatAmount.toNumber()]);
  }
  rows.push(['Iš viso apmokėti', '', '', '', '', totals.total.toNumber()]);
  return rows;
}

export function exportInvoiceToXlsx(invoice: Invoice, client: Client, settings: SettingsDto): void {
  const seller = getSellerRows(settings);
  const buyer = getBuyerRows(client);
  const info = getInvoiceInfoRows(invoice);
  const items = getItemRows(invoice);
  const summary = getSummaryRows(invoice);

  const aoa = [
    ...info,
    [],
    ...seller,
    [],
    ...buyer,
    [],
    ['PREKĖS IR PASLAUGOS'],
    ...items,
    [],
    ...summary,
  ];

  if (invoice.notes) {
    aoa.push([], ['Pastabos:'], [invoice.notes]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'Sąskaita-Faktūra');
  
  const filename = `${formatDate(invoice.issueDate)}_${invoice.number.toString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
