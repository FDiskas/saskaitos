import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { StoragePath, useStorage, type Storage } from '@/lib/storage';
import { InvoiceId, InvoiceSummary, Money, type Client } from '@/lib/domain';
import { InvoicesIndexFileSchema, type InvoiceIndexEntry } from '@/lib/drive/schemas';
import { getClientFolder } from './useInvoice';
import { useClients } from './useClients';

function entryToSummary(client: Client, entry: InvoiceIndexEntry): InvoiceSummary {
  const issueDate = new Date(entry.date);
  const dueDate = entry.dueDate ? new Date(entry.dueDate) : issueDate;
  return InvoiceSummary.of({
    id: InvoiceId.fromString(entry.id),
    number: entry.number,
    clientId: client.id,
    clientName: client.name,
    issueDate,
    dueDate,
    amount: Money.fromCents(entry.amountCents, entry.currency),
    status: entry.status,
  });
}

async function readClientSummaries(storage: Storage, client: Client): Promise<InvoiceSummary[]> {
  const indexPath = StoragePath.of(getClientFolder(client), 'invoices_index.json');
  try {
    const entries = await storage.read(indexPath, InvoicesIndexFileSchema);
    if (!entries) return [];
    return entries.map((e) => entryToSummary(client, e));
  } catch (err) {
    console.error(`Nepavyko nuskaityti kliento ${client.name} sąskaitų indekso.`, err);
    return [];
  }
}

async function aggregateSummaries(storage: Storage, clients: Client[]): Promise<InvoiceSummary[]> {
  const perClient = await Promise.all(clients.map((c) => readClientSummaries(storage, c)));
  return perClient.flat();
}

export function useInvoiceList() {
  const storage = useStorage();
  const { clients, isLoading: isClientsLoading } = useClients();

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- storage is stable via context
  const query = useQuery({
    queryKey: queryKeys.invoiceList,
    queryFn: () => aggregateSummaries(storage, clients),
    enabled: !isClientsLoading,
    staleTime: 30_000,
  });

  return {
    summaries: query.data ?? [],
    isLoading: isClientsLoading || query.isLoading,
    error: query.error,
  };
}
