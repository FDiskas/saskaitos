import { describe, it, expect } from 'vitest';
import { Client, ClientId, InvoiceNumber } from '@/lib/domain';
import {
  getClientFolder,
  getClientFolderPath,
  getClientIndexPath,
  getInvoicePath,
  getInvoicePdfPath,
} from './clientPaths';

function makeClient(name: string, id: string): Client {
  return Client.of({
    id: ClientId.fromString(id),
    name,
    address: 'Gatvė 1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
}

const ID = '01890000-0000-7000-8000-000000000000';

describe('getClientFolder', () => {
  it('when client has a name and id, then folder is slug plus short id', () => {
    const client = makeClient('UAB Pavyzdys', ID);
    expect(getClientFolder(client)).toBe('Saskaitos_App/Clients/Client_uab-pavyzdys_018900');
  });
});

describe('getClientFolderPath', () => {
  it('when given a client, then folder path string equals getClientFolder', () => {
    const client = makeClient('Foo', ID);
    expect(getClientFolderPath(client).toString()).toBe(getClientFolder(client));
  });
});

describe('getClientIndexPath', () => {
  it('when given a client, then index path is folder plus invoices_index.json', () => {
    const client = makeClient('Foo', ID);
    expect(getClientIndexPath(client).toString()).toBe(
      'Saskaitos_App/Clients/Client_foo_018900/invoices_index.json',
    );
  });
});

describe('getInvoicePath', () => {
  it('when given client, number and date, then path is year folder plus dated json filename', () => {
    const client = makeClient('Foo', ID);
    const number = InvoiceNumber.of('SF', 7);
    const date = new Date('2026-05-22T10:00:00Z');
    expect(getInvoicePath(client, number, date).toString()).toBe(
      'Saskaitos_App/Clients/Client_foo_018900/2026/2026-05-22_SF0007.json',
    );
  });
});

describe('getInvoicePdfPath', () => {
  it('when given client, number and date, then path matches invoice path with pdf extension', () => {
    const client = makeClient('Foo', ID);
    const number = InvoiceNumber.of('SF', 7);
    const date = new Date('2026-05-22T10:00:00Z');
    expect(getInvoicePdfPath(client, number, date).toString()).toBe(
      'Saskaitos_App/Clients/Client_foo_018900/2026/2026-05-22_SF0007.pdf',
    );
  });
});
