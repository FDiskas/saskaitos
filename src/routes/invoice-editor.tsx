import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearch } from '@tanstack/react-router';
import { ArrowLeft, Loader2, CloudLightning, CheckCircle2 } from 'lucide-react';
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useSettings,
  useClients,
  useInvoiceAutosave,
} from '@/hooks';
import { DesignSidebar, InvoiceCanvas, InvoiceActions, NewInvoicePicker } from '@/components/invoice';
import { type Invoice, ClientId } from '@/lib/domain';

export function InvoiceEditorPage() {
  const { id } = useParams({ from: '/invoice-editor/$id' });
  const { clientId } = useSearch({ from: '/invoice-editor/$id' });
  const isNew = id === 'new';

  const { invoice, isLoading: isInvoiceLoading, error: invoiceError } = useInvoice(id);
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { clients, isLoading: isClientsLoading } = useClients();

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [localInvoice, setLocalInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (
      isNew &&
      clientId &&
      !isClientsLoading &&
      !createMutation.isPending &&
      !createMutation.isSuccess &&
      !createMutation.isError
    ) {
      try {
        const parsedId = ClientId.fromString(clientId);
        createMutation.mutate(parsedId);
      } catch (err) {
        console.error('Invalid client ID in query params', err);
      }
    }
  }, [isNew, clientId, isClientsLoading, createMutation]);

  useEffect(() => {
    if (invoice && !updateMutation.isPending) {
      setLocalInvoice(invoice);
    }
  }, [invoice, updateMutation.isPending]);

  const handleSave = useCallback(
    (payload: { updated: Invoice; previous: Invoice }) => updateMutation.mutate(payload),
    [updateMutation],
  );

  const isPendingSave = useInvoiceAutosave({
    local: localInvoice,
    server: invoice,
    enabled: !isNew,
    onSave: handleSave,
  });

  if (isInvoiceLoading || isSettingsLoading || isClientsLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
        <p className="text-sm font-medium text-slate-600">Kraunami redaktoriaus duomenys...</p>
      </div>
    );
  }

  if (!isNew && (invoiceError || !invoice)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
        <p className="text-red-600 font-semibold">Nepavyko užkrauti sąskaitos.</p>
        <p className="text-sm text-slate-500 max-w-md">{(invoiceError as Error)?.message || 'Sąskaita nerasta.'}</p>
        <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
          Grįžti į pultą
        </Link>
      </div>
    );
  }

  if (isNew) {
    return (
      <NewInvoicePicker
        onClientSelected={(clientId) => createMutation.mutate(clientId)}
        isPending={createMutation.isPending}
      />
    );
  }

  if (!localInvoice || !settings) return null;

  const client = clients.find((c) => c.id.equals(localInvoice.clientId));

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pultas
          </Link>
          <div className="h-4 w-px bg-slate-250" />
          <span className="text-sm font-bold text-slate-900 font-mono">
            Redaguojama: {localInvoice.number.toString()}
          </span>
        </div>

        <SyncStatusPill isSaving={updateMutation.isPending} isPendingSave={isPendingSave} />

        {client ? (
          <InvoiceActions invoice={localInvoice} client={client} settings={settings} />
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100 font-medium">
            Pasirinkite klientą, kad galėtumėte eksportuoti
          </div>
        )}
      </header>

      <div className="flex flex-row flex-grow h-[calc(100vh-57px)] overflow-hidden print:h-auto print:overflow-visible">
        <DesignSidebar invoice={localInvoice} onChange={setLocalInvoice} settings={settings} />

        <main className="flex-grow overflow-y-auto p-8 flex justify-center bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
          <InvoiceCanvas invoice={localInvoice} onChange={setLocalInvoice} settings={settings} />
        </main>
      </div>
    </div>
  );
}

interface SyncStatusPillProps {
  isSaving: boolean;
  isPendingSave: boolean;
}

function SyncStatusPill({ isSaving, isPendingSave }: SyncStatusPillProps) {
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
        <Loader2 className="h-3 w-3 animate-spin" />
        Išsaugoma...
      </span>
    );
  }
  if (isPendingSave) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <CloudLightning className="h-3 w-3" />
        Laukiama išsaugojimo...
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
      <CheckCircle2 className="h-3 w-3" />
      Išsaugota Drive
    </span>
  );
}
