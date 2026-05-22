import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { useStorage } from '@/lib/storage';
import { useClients } from './useClients';
import { Invoice, Client, InvoiceNumber } from '@/lib/domain';
import { InvoiceDtoSchema, invoiceFromDto, InvoicesIndexFileSchema, type InvoiceIndexEntry } from '@/lib/drive/schemas';
import { StoragePath } from '@/lib/storage';
import { formatDate } from '@/lib/format/date';

export function getClientFolder(client: Client): string {
  const shortId = client.id.toString().slice(0, 6);
  return `Saskaitos_App/Clients/Client_${client.slug()}_${shortId}`;
}

export function getInvoicePath(client: Client, number: InvoiceNumber, date: Date): StoragePath {
  const year = date.getFullYear().toString();
  const dateStr = formatDate(date);
  const filename = `${dateStr}_${number.toString()}.json`;
  return StoragePath.of(`${getClientFolder(client)}/${year}`, filename);
}

export function getInvoicePdfPath(client: Client, number: InvoiceNumber, date: Date): StoragePath {
  const year = date.getFullYear().toString();
  const dateStr = formatDate(date);
  const filename = `${dateStr}_${number.toString()}.pdf`;
  return StoragePath.of(`${getClientFolder(client)}/${year}`, filename);
}

export function useInvoice(invoiceId: string) {
  const storage = useStorage();
  const { clients, isLoading: isClientsLoading } = useClients();

  const query = useQuery({
    queryKey: queryKeys.invoice(invoiceId),
    queryFn: async (): Promise<Invoice | null> => {
      if (invoiceId === 'new') return null;

      // 1. Search in each client's invoices_index.json to find the client and metadata
      let foundClient: Client | null = null;
      let foundEntry: InvoiceIndexEntry | null = null;

      for (const client of clients) {
        const clientFolder = getClientFolder(client);
        const indexPath = StoragePath.of(clientFolder, 'invoices_index.json');
        try {
          const index = await storage.read(indexPath, InvoicesIndexFileSchema);
          if (index) {
            const entry = index.find((e) => e.id === invoiceId);
            if (entry) {
              foundClient = client;
              foundEntry = entry;
              break;
            }
          }
        } catch (err) {
          console.error(`Failed to read index for client ${client.name}`, err);
        }
      }

      if (!foundClient || !foundEntry) {
        throw new Error(`Sąskaita ${invoiceId} nerasta nei vieno kliento aplanke.`);
      }

      // 2. Read the actual invoice JSON file
      const dateVal = new Date(foundEntry.date);
      const year = dateVal.getFullYear().toString();
      const dateStr = formatDate(dateVal);
      const filename = `${dateStr}_${foundEntry.number}.json`;
      const invoicePath = StoragePath.of(`${getClientFolder(foundClient)}/${year}`, filename);

      const dto = await storage.read(invoicePath, InvoiceDtoSchema);
      if (!dto) {
        throw new Error(`Sąskaitos failas nerastas: ${invoicePath.toString()}`);
      }

      return invoiceFromDto(dto);
    },
    // Only run the query when clients list is loaded and not empty
    enabled: invoiceId !== 'new' && !isClientsLoading && clients.length > 0,
    staleTime: 30_000,
  });

  return {
    invoice: query.data || null,
    isLoading: isClientsLoading || query.isLoading,
    error: query.error,
  };
}
