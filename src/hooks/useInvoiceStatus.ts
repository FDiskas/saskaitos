import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { StoragePath, type Storage } from '@/lib/storage';
import { useStorage } from './useStorage';
import { applyStatus, InvoiceSummary, type Client, type InvoiceStatus } from '@/lib/domain';
import {
  InvoiceDtoSchema,
  invoiceFromDto,
  invoiceToDto,
  InvoicesIndexFileSchema,
  type InvoiceIndexEntry,
} from '@/lib/drive/schemas';
import { formatDate } from '@/lib/format/date';
import { syncQueue } from '@/stores';
import { useClients } from './useClients';
import { getClientFolder, getInvoicePath } from './useInvoice';

interface StatusMutationVars {
  summary: InvoiceSummary;
  status: InvoiceStatus;
}

function indexPathFor(client: Client): StoragePath {
  return StoragePath.of(getClientFolder(client), 'invoices_index.json');
}

function patchIndexEntry(
  index: InvoiceIndexEntry[],
  invoiceId: string,
  patch: Partial<InvoiceIndexEntry>,
): InvoiceIndexEntry[] {
  return index.map((e) => (e.id === invoiceId ? { ...e, ...patch } : e));
}

async function readInvoiceFromSummary(storage: Storage, client: Client, summary: InvoiceSummary) {
  const year = summary.issueDate.getFullYear().toString();
  const filename = `${formatDate(summary.issueDate)}_${summary.number}.json`;
  const path = StoragePath.of(`${getClientFolder(client)}/${year}`, filename);
  const dto = await storage.read(path, InvoiceDtoSchema);
  if (!dto) throw new Error(`Sąskaita nerasta: ${path.toString()}`);
  return invoiceFromDto(dto);
}

async function persistStatusChange(
  storage: Storage,
  client: Client,
  summary: InvoiceSummary,
  target: InvoiceStatus,
): Promise<void> {
  const invoice = await readInvoiceFromSummary(storage, client, summary);
  const updated = applyStatus(invoice, target);

  const invoicePath = getInvoicePath(client, updated.number, updated.issueDate);
  await storage.write(invoicePath, invoiceToDto(updated));

  const idxPath = indexPathFor(client);
  const idx = (await storage.read(idxPath, InvoicesIndexFileSchema)) ?? [];
  await storage.write(idxPath, patchIndexEntry(idx, updated.id.toString(), { status: target }));
}

export function useInvoiceStatus() {
  const storage = useStorage();
  const qc = useQueryClient();
  const { clients } = useClients();

  return useMutation<
    void,
    Error,
    StatusMutationVars,
    { prevList: InvoiceSummary[] | undefined }
  >({
    mutationFn: async ({ summary, status }) => {
      const client = clients.find((c) => c.id.equals(summary.clientId));
      if (!client) throw new Error('Klientas nerastas.');
      await syncQueue.enqueue(() => persistStatusChange(storage, client, summary, status));
    },
    onMutate: async ({ summary, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.invoiceList });
      const prevList = qc.getQueryData<InvoiceSummary[]>(queryKeys.invoiceList);
      qc.setQueryData<InvoiceSummary[]>(queryKeys.invoiceList, (current) =>
        (current ?? []).map((s) =>
          s.id.equals(summary.id)
            ? InvoiceSummary.of({
                id: s.id,
                number: s.number,
                clientId: s.clientId,
                clientName: s.clientName,
                issueDate: s.issueDate,
                dueDate: s.dueDate,
                amount: s.amount,
                status,
              })
            : s,
        ),
      );
      return { prevList };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList !== undefined) {
        qc.setQueryData(queryKeys.invoiceList, ctx.prevList);
      }
    },
    onSettled: (_data, _err, { summary }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoiceList });
      void qc.invalidateQueries({ queryKey: queryKeys.invoice(summary.id.toString()) });
    },
  });
}
