import type { Client, InvoiceNumber } from '@/lib/domain';
import { formatDate } from '@/lib/format/date';
import { StoragePath } from './StoragePath';

const INVOICES_INDEX_FILE = 'invoices_index.json';
const CLIENTS_ROOT = 'Saskaitos_App/Clients';

function clientFolderName(client: Client): string {
  const shortId = client.id.toString().slice(0, 6);
  return `Client_${client.slug()}_${shortId}`;
}

export function getClientFolder(client: Client): string {
  return `${CLIENTS_ROOT}/${clientFolderName(client)}`;
}

export function getClientFolderPath(client: Client): StoragePath {
  return StoragePath.of(CLIENTS_ROOT, clientFolderName(client));
}

export function getClientIndexPath(client: Client): StoragePath {
  return StoragePath.of(getClientFolder(client), INVOICES_INDEX_FILE);
}

function getInvoiceFilePath(client: Client, number: InvoiceNumber, date: Date, ext: string): StoragePath {
  const year = date.getFullYear().toString();
  const filename = `${formatDate(date)}_${number.toString()}.${ext}`;
  return StoragePath.of(`${getClientFolder(client)}/${year}`, filename);
}

export function getInvoicePath(client: Client, number: InvoiceNumber, date: Date): StoragePath {
  return getInvoiceFilePath(client, number, date, 'json');
}

export function getInvoicePdfPath(client: Client, number: InvoiceNumber, date: Date): StoragePath {
  return getInvoiceFilePath(client, number, date, 'pdf');
}
