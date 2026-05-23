import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { queryKeys } from '@/query-keys';
import {
  APP_ROOT,
  SETTINGS_FILE,
  StoragePath,
  useStorage,
  type Storage,
} from '@/lib/storage';
import {
  Invoice,
  InvoiceId,
  LineItems,
  VatRate,
  Series,
  type ClientId,
  type Client,
} from '@/lib/domain';
import {
  invoiceToDto,
  InvoicesIndexFileSchema,
  seriesToDto,
  type InvoiceIndexEntry,
  type InvoicesIndexFileDto,
} from '@/lib/drive/schemas';
import { SettingsDtoSchema, defaultSettings, type SettingsDto } from '@/lib/drive/settings';
import { syncQueue } from '@/stores';
import { useClients } from './useClients';
import { getClientFolder, getInvoicePath } from './useInvoice';

const SETTINGS_PATH = StoragePath.of(APP_ROOT, SETTINGS_FILE);

function indexPathFor(client: Client): StoragePath {
  return StoragePath.of(getClientFolder(client), 'invoices_index.json');
}

function buildIndexEntry(invoice: Invoice): InvoiceIndexEntry {
  return {
    id: invoice.id.toString(),
    number: invoice.number.toString(),
    date: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    amountCents: invoice.totals().total.toCents(),
    currency: invoice.totals().total.currency,
    status: invoice.status,
    companyId: invoice.companyId,
  };
}

function applySeriesIncrement(settings: SettingsDto, updated: Series): SettingsDto {
  return {
    ...settings,
    series: settings.series.map((s) => (s.id === updated.id ? seriesToDto(updated) : s)),
  };
}

export function useCreateInvoice() {
  const storage = useStorage();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { clients } = useClients();

  return useMutation<Invoice, Error, ClientId>({
    mutationFn: async (clientId) => {
      let createdInvoice: Invoice | null = null;

      await syncQueue.enqueue(async () => {
        const latestSettings = (await storage.read(SETTINGS_PATH, SettingsDtoSchema)) || defaultSettings();
        const defaultSeriesDto = latestSettings.series.find((s) => s.isDefault) || latestSettings.series[0];
        if (!defaultSeriesDto) {
          throw new Error('Nėra sukonfigūruotų sąskaitų serijų nustatymuose.');
        }

        const client = clients.find((c) => c.id.equals(clientId));
        if (!client) {
          throw new Error(`Klientas nerastas: ${clientId.toString()}`);
        }

        const series = Series.of(defaultSeriesDto);
        const { number, updatedSeries } = series.next();

        const activeCompanyId =
          latestSettings.activeCompanyId ?? latestSettings.companies[0]?.id;

        const invoice = Invoice.create({
          id: InvoiceId.create(),
          number,
          seriesId: defaultSeriesDto.id,
          clientId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          lineItems: LineItems.empty(),
          vat: { enabled: false, rate: VatRate.of(21) },
          status: 'draft',
          designPresetId: latestSettings.designPresets[0]?.id || 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
          companyId: activeCompanyId,
        });

        const invoicePath = getInvoicePath(client, number, invoice.issueDate);
        const indexPath = indexPathFor(client);
        const previousIndex = (await storage.read(indexPath, InvoicesIndexFileSchema)) || [];
        const updatedSettings = applySeriesIncrement(latestSettings, updatedSeries);
        const updatedIndex = [...previousIndex, buildIndexEntry(invoice)];

        createdInvoice = await persistNewInvoiceAtomic({
          storage,
          settingsPath: SETTINGS_PATH,
          settingsPrev: latestSettings,
          settingsNext: updatedSettings,
          invoicePath,
          invoice,
          indexPath,
          indexPrev: previousIndex,
          indexNext: updatedIndex,
        });
      });

      if (!createdInvoice) {
        throw new Error('Nepavyko sukurti sąskaitos.');
      }

      return createdInvoice;
    },
    onSuccess: (newInvoice) => {
      void qc.invalidateQueries({ queryKey: queryKeys.settings });
      void qc.invalidateQueries({ queryKey: queryKeys.invoiceList });
      void navigate({ to: `/invoice-editor/${newInvoice.id.toString()}` });
    },
  });
}

interface AtomicCreateParams {
  storage: Storage;
  settingsPath: StoragePath;
  settingsPrev: SettingsDto;
  settingsNext: SettingsDto;
  invoicePath: StoragePath;
  invoice: Invoice;
  indexPath: StoragePath;
  indexPrev: InvoicesIndexFileDto;
  indexNext: InvoicesIndexFileDto;
}

async function persistNewInvoiceAtomic(p: AtomicCreateParams): Promise<Invoice> {
  await p.storage.write(p.settingsPath, p.settingsNext);

  try {
    await p.storage.write(p.invoicePath, invoiceToDto(p.invoice));
  } catch (err) {
    await p.storage.write(p.settingsPath, p.settingsPrev).catch(() => undefined);
    throw err;
  }

  try {
    await p.storage.write(p.indexPath, p.indexNext);
  } catch (err) {
    await p.storage.delete(p.invoicePath).catch(() => undefined);
    await p.storage.write(p.settingsPath, p.settingsPrev).catch(() => undefined);
    throw err;
  }

  return p.invoice;
}

interface UpdateContext {
  storage: Storage;
  prevClient: Client;
  nextClient: Client;
  previous: Invoice;
  updated: Invoice;
}

async function writeInvoiceFile(ctx: UpdateContext): Promise<void> {
  const prevPath = getInvoicePath(ctx.prevClient, ctx.previous.number, ctx.previous.issueDate);
  const nextPath = getInvoicePath(ctx.nextClient, ctx.updated.number, ctx.updated.issueDate);

  await ctx.storage.write(nextPath, invoiceToDto(ctx.updated));

  if (prevPath.equals(nextPath)) return;
  try {
    await ctx.storage.delete(prevPath);
  } catch (err) {
    console.warn(`Nepavyko ištrinti seno sąskaitos failo: ${prevPath.toString()}`, err);
  }
}

async function syncIndexAcrossClients(ctx: UpdateContext): Promise<void> {
  const prevIndexPath = indexPathFor(ctx.prevClient);
  const prevIndex = (await ctx.storage.read(prevIndexPath, InvoicesIndexFileSchema)) || [];
  await ctx.storage.write(
    prevIndexPath,
    prevIndex.filter((e) => e.id !== ctx.updated.id.toString()),
  );

  const nextIndexPath = indexPathFor(ctx.nextClient);
  const nextIndex = (await ctx.storage.read(nextIndexPath, InvoicesIndexFileSchema)) || [];
  await ctx.storage.write(nextIndexPath, [
    ...nextIndex.filter((e) => e.id !== ctx.updated.id.toString()),
    buildIndexEntry(ctx.updated),
  ]);
}

async function syncIndexSameClient(ctx: UpdateContext): Promise<void> {
  const indexPath = indexPathFor(ctx.nextClient);
  const index = (await ctx.storage.read(indexPath, InvoicesIndexFileSchema)) || [];
  const entry = buildIndexEntry(ctx.updated);
  const hasEntry = index.some((e) => e.id === ctx.updated.id.toString());
  const next = hasEntry
    ? index.map((e) => (e.id === ctx.updated.id.toString() ? entry : e))
    : [...index, entry];
  await ctx.storage.write(indexPath, next);
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

        const ctx: UpdateContext = { storage, prevClient, nextClient, previous, updated };
        await writeInvoiceFile(ctx);
        if (previous.clientId.equals(updated.clientId)) {
          await syncIndexSameClient(ctx);
          return;
        }
        await syncIndexAcrossClients(ctx);
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

        const indexPath = indexPathFor(client);
        const index = (await storage.read(indexPath, InvoicesIndexFileSchema)) || [];
        await storage.write(
          indexPath,
          index.filter((e) => e.id !== invoice.id.toString()),
        );
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoiceList });
    },
  });
}
