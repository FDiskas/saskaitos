import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { queryKeys } from '@/query-keys';
import {
  APP_ROOT,
  SETTINGS_FILE,
  StoragePath,
  useStorage,
} from '@/lib/storage';
import {
  Invoice,
  InvoiceId,
  LineItems,
  VatRate,
  Series,
  ClientId,
} from '@/lib/domain';
import {
  invoiceToDto,
  InvoicesIndexFileSchema,
  seriesToDto,
  type InvoiceIndexEntry,
} from '@/lib/drive/schemas';
import { SettingsDtoSchema, defaultSettings } from '@/lib/drive/settings';
import { syncQueue } from '@/stores';
import { useClients } from './useClients';
import { getClientFolder, getInvoicePath } from './useInvoice';

const SETTINGS_PATH = StoragePath.of(APP_ROOT, SETTINGS_FILE);

export function useCreateInvoice() {
  const storage = useStorage();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { clients } = useClients();

  return useMutation<Invoice, Error, ClientId>({
    mutationFn: async (clientId) => {
      let createdInvoice: Invoice | null = null;

      await syncQueue.enqueue(async () => {
        // 1. Read settings to increment the default series number
        const latestSettings = await storage.read(SETTINGS_PATH, SettingsDtoSchema) || defaultSettings();
        const defaultSeriesDto = latestSettings.series.find((s) => s.isDefault) || latestSettings.series[0];
        if (!defaultSeriesDto) {
          throw new Error('Nėra sukonfigūruotų sąskaitų serijų nustatymuose.');
        }

        const series = Series.of(defaultSeriesDto);
        const { number, updatedSeries } = series.next();

        // 2. Find client
        const client = clients.find((c) => c.id.equals(clientId));
        if (!client) {
          throw new Error(`Klientas nerastas: ${clientId.toString()}`);
        }

        // 3. Create the Invoice entity
        const invoice = Invoice.create({
          id: InvoiceId.create(),
          number,
          seriesId: defaultSeriesDto.id,
          clientId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
          lineItems: LineItems.empty(),
          vat: { enabled: false, rate: VatRate.of(21) },
          status: 'draft',
          designPresetId: latestSettings.designPresets[0]?.id || 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // 4. Update settings with incremented series number
        const updatedSettings = {
          ...latestSettings,
          series: latestSettings.series.map((s) =>
            s.id === updatedSeries.id ? seriesToDto(updatedSeries) : s,
          ),
        };
        await storage.write(SETTINGS_PATH, updatedSettings);

        // 5. Write the invoice file
        const invoicePath = getInvoicePath(client, number, invoice.issueDate);
        await storage.write(invoicePath, invoiceToDto(invoice));

        // 6. Update client's invoices_index.json
        const clientFolder = getClientFolder(client);
        const indexPath = StoragePath.of(clientFolder, 'invoices_index.json');
        const latestIndex = await storage.read(indexPath, InvoicesIndexFileSchema) || [];
        const indexEntry: InvoiceIndexEntry = {
          id: invoice.id.toString(),
          number: number.toString(),
          date: invoice.issueDate.toISOString(),
          amountCents: invoice.totals().total.toCents(),
          currency: invoice.totals().total.currency,
          status: invoice.status,
        };
        await storage.write(indexPath, [...latestIndex, indexEntry]);

        createdInvoice = invoice;
      });

      if (!createdInvoice) {
        throw new Error('Nepavyko sukurti sąskaitos.');
      }

      return createdInvoice;
    },
    onSuccess: (newInvoice) => {
      // Invalidate queries
      void qc.invalidateQueries({ queryKey: queryKeys.settings });
      void qc.invalidateQueries({ queryKey: queryKeys.invoiceList });
      // Redirect to the newly created invoice editor
      void navigate({ to: `/invoice-editor/${newInvoice.id.toString()}` });
    },
  });
}

export function useUpdateInvoice() {
  const storage = useStorage();
  const qc = useQueryClient();
  const { clients } = useClients();

  return useMutation<
    void,
    Error,
    { updated: Invoice; previous: Invoice },
    { prevInvoice: Invoice | undefined }
  >({
    mutationFn: async ({ updated, previous }) => {
      await syncQueue.enqueue(async () => {
        const prevClient = clients.find((c) => c.id.equals(previous.clientId));
        const nextClient = clients.find((c) => c.id.equals(updated.clientId));
        if (!prevClient || !nextClient) {
          throw new Error('Klientas nerastas.');
        }

        const prevPath = getInvoicePath(prevClient, previous.number, previous.issueDate);
        const nextPath = getInvoicePath(nextClient, updated.number, updated.issueDate);

        // 1. Write the new/updated file
        await storage.write(nextPath, invoiceToDto(updated));

        // 2. If path has changed (e.g. date, number, or client changed), delete old file
        if (!prevPath.equals(nextPath)) {
          try {
            await storage.delete(prevPath);
          } catch (err) {
            console.warn(`Nepavyko ištrinti seno sąskaitos failo: ${prevPath.toString()}`, err);
          }
        }

        // 3. Update invoices_index.json
        if (!previous.clientId.equals(updated.clientId)) {
          // Client changed - remove from old index, add to new index
          const prevIndexPath = StoragePath.of(getClientFolder(prevClient), 'invoices_index.json');
          const prevIndex = await storage.read(prevIndexPath, InvoicesIndexFileSchema) || [];
          const updatedPrevIndex = prevIndex.filter((e) => e.id !== updated.id.toString());
          await storage.write(prevIndexPath, updatedPrevIndex);

          const nextIndexPath = StoragePath.of(getClientFolder(nextClient), 'invoices_index.json');
          const nextIndex = await storage.read(nextIndexPath, InvoicesIndexFileSchema) || [];
          const indexEntry: InvoiceIndexEntry = {
            id: updated.id.toString(),
            number: updated.number.toString(),
            date: updated.issueDate.toISOString(),
            amountCents: updated.totals().total.toCents(),
            currency: updated.totals().total.currency,
            status: updated.status,
          };
          await storage.write(nextIndexPath, [
            ...nextIndex.filter((e) => e.id !== updated.id.toString()),
            indexEntry,
          ]);
        } else {
          // Same client - update entry in index
          const indexPath = StoragePath.of(getClientFolder(nextClient), 'invoices_index.json');
          const index = await storage.read(indexPath, InvoicesIndexFileSchema) || [];
          const indexEntry: InvoiceIndexEntry = {
            id: updated.id.toString(),
            number: updated.number.toString(),
            date: updated.issueDate.toISOString(),
            amountCents: updated.totals().total.toCents(),
            currency: updated.totals().total.currency,
            status: updated.status,
          };
          const updatedIndex = index.map((e) => (e.id === updated.id.toString() ? indexEntry : e));
          if (!index.some((e) => e.id === updated.id.toString())) {
            updatedIndex.push(indexEntry);
          }
          await storage.write(indexPath, updatedIndex);
        }
      });
    },
    onMutate: async ({ updated }) => {
      const key = queryKeys.invoice(updated.id.toString());
      await qc.cancelQueries({ queryKey: key });
      const prevInvoice = qc.getQueryData<Invoice>(key);
      qc.setQueryData<Invoice>(key, updated);
      return { prevInvoice };
    },
    onError: (_err, { updated }, ctx) => {
      if (ctx?.prevInvoice) {
        qc.setQueryData(queryKeys.invoice(updated.id.toString()), ctx.prevInvoice);
      }
    },
    onSettled: (_data, _err, { updated }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoice(updated.id.toString()) });
      void qc.invalidateQueries({ queryKey: queryKeys.invoiceList });
    },
  });
}

export function useDeleteInvoice() {
  const storage = useStorage();
  const qc = useQueryClient();
  const { clients } = useClients();

  return useMutation<void, Error, Invoice>({
    mutationFn: async (invoice) => {
      await syncQueue.enqueue(async () => {
        const client = clients.find((c) => c.id.equals(invoice.clientId));
        if (!client) {
          throw new Error('Klientas nerastas.');
        }

        const path = getInvoicePath(client, invoice.number, invoice.issueDate);
        try {
          await storage.delete(path);
        } catch (err) {
          console.warn(`Nepavyko ištrinti sąskaitos failo: ${path.toString()}`, err);
        }

        const indexPath = StoragePath.of(getClientFolder(client), 'invoices_index.json');
        const index = await storage.read(indexPath, InvoicesIndexFileSchema) || [];
        const updatedIndex = index.filter((e) => e.id !== invoice.id.toString());
        await storage.write(indexPath, updatedIndex);
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoiceList });
    },
  });
}
