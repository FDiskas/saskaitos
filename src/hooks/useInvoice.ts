import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { useStorage } from './useStorage';
import { useClients } from './useClients';
import { type Invoice, type Client } from '@/lib/domain';
import { InvoiceDtoSchema, invoiceFromDto, InvoicesIndexFileSchema, type InvoiceIndexEntry } from '@/lib/drive/schemas';
import { StoragePath } from '@/lib/storage';
import { getClientFolder, getClientIndexPath } from '@/lib/storage/clientPaths';
import { formatDate } from '@/lib/format/date';

export function useInvoice(invoiceId: string) {
  const storage = useStorage();
  const { clients, isLoading: isClientsLoading } = useClients();

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- storage and clients are read freshly; invalidation drives refetch
  const query = useQuery({
    queryKey: queryKeys.invoice(invoiceId),
    queryFn: async (): Promise<Invoice | null> => {
      if (invoiceId === 'new') return null;

      let foundClient: Client | null = null;
      let foundEntry: InvoiceIndexEntry | null = null;

      for (const client of clients) {
        const indexPath = getClientIndexPath(client);
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
    enabled: invoiceId !== 'new' && !isClientsLoading && clients.length > 0,
    staleTime: 30_000,
  });

  return {
    invoice: query.data || null,
    isLoading: isClientsLoading || query.isLoading,
    error: query.error,
  };
}
