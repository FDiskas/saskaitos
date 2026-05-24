import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { StoragePath, type Storage } from '@/lib/storage';
import { useStorage } from './useStorage';
import { InvoiceId, InvoiceSummary, Money, type Client } from '@/lib/domain';
import { InvoicesIndexFileSchema, type InvoiceIndexEntry } from '@/lib/drive/schemas';
import { getClientFolder } from './useInvoice';
import { useClients } from './useClients';
import { useSettings } from './useSettings';

function entryToSummary(
  client: Client,
  entry: InvoiceIndexEntry,
  defaultCompanyId: string | null,
): InvoiceSummary {
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
    companyId: entry.companyId ?? defaultCompanyId ?? undefined,
  });
}

async function readClientSummaries(
  storage: Storage,
  client: Client,
  defaultCompanyId: string | null,
): Promise<InvoiceSummary[]> {
  const indexPath = StoragePath.of(getClientFolder(client), 'invoices_index.json');
  try {
    const entries = await storage.read(indexPath, InvoicesIndexFileSchema);
    if (!entries) return [];
    return entries.map((e) => entryToSummary(client, e, defaultCompanyId));
  } catch (err) {
    console.error(`Nepavyko nuskaityti kliento ${client.name} sąskaitų indekso.`, err);
    return [];
  }
}

async function aggregateSummaries(
  storage: Storage,
  clients: Client[],
  defaultCompanyId: string | null,
): Promise<InvoiceSummary[]> {
  const perClient = await Promise.all(
    clients.map((c) => readClientSummaries(storage, c, defaultCompanyId)),
  );
  return perClient.flat();
}

export function useInvoiceList() {
  const storage = useStorage();
  const { clients, isLoading: isClientsLoading } = useClients();
  const { settings } = useSettings();

  const defaultCompanyId = settings?.companies[0]?.id ?? null;

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- storage is stable via context
  const query = useQuery({
    queryKey: [...queryKeys.invoiceList, defaultCompanyId],
    queryFn: () => aggregateSummaries(storage, clients, defaultCompanyId),
    enabled: !isClientsLoading,
    staleTime: 30_000,
  });

  return {
    summaries: query.data ?? [],
    isLoading: isClientsLoading || query.isLoading,
    error: query.error,
  };
}
