import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Loader2, CloudLightning, CheckCircle2 } from 'lucide-react';
import { useInvoice, useCreateInvoice, useUpdateInvoice, useSettings, useClients } from '@/hooks';
import { DesignSidebar, InvoiceCanvas, InvoiceActions } from '@/components/invoice';
import { ClientCombobox } from '@/components/shared';
import { Invoice } from '@/lib/domain';

export function InvoiceEditorPage() {
  const { id } = useParams({ from: '/invoice-editor/$id' });
  const isNew = id === 'new';

  const { invoice, isLoading: isInvoiceLoading, error: invoiceError } = useInvoice(id);
  const { settings, isLoading: isSettingsLoading, update: updateSettings } = useSettings();
  const { clients, isLoading: isClientsLoading } = useClients();

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [localInvoice, setLocalInvoice] = useState<Invoice | null>(null);
  const [isPendingSave, setIsPendingSave] = useState(false);

  // Sync server state to local state
  useEffect(() => {
    if (invoice && !updateMutation.isPending) {
      setLocalInvoice(invoice);
      setIsPendingSave(false);
    }
  }, [invoice, updateMutation.isPending]);

  // Debounced autosave
  useEffect(() => {
    if (!localInvoice || !invoice || isNew) return;
    if (localInvoice.updatedAt.getTime() <= invoice.updatedAt.getTime()) {
      setIsPendingSave(false);
      return;
    }

    setIsPendingSave(true);
    const timer = setTimeout(() => {
      updateMutation.mutate({ updated: localInvoice, previous: invoice });
    }, 500);

    return () => clearTimeout(timer);
  }, [localInvoice, invoice, isNew, updateMutation]);

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

  // State: New Invoice (select client first)
  if (isNew) {
    return (
      <div className="flex h-screen w-screen flex-col bg-slate-50 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="text-xl font-bold text-slate-900">Nauja sąskaita-faktūra</h2>
            <p className="text-sm text-slate-500">Pasirinkite klientą, kuriam norite išrašyti naują sąskaitą.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Klientas</label>
            <ClientCombobox
              value={null}
              onChange={(val) => {
                if (val) {
                  const client = clients.find((c) => c.id.toString() === val);
                  if (client) createMutation.mutate(client.id);
                }
              }}
              placeholder="Pasirinkite iš sąrašo..."
            />
          </div>

          {createMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 py-2 rounded-md border border-slate-150">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
              Generuojamas sąskaitos numeris ir failai...
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
            <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Atšaukti
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!localInvoice || !settings) return null;

  const client = clients.find((c) => c.id.equals(localInvoice.clientId));

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Redaktoriaus Header (ekrane tik) */}
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

        {/* Išsaugojimo būsena */}
        <div className="flex items-center gap-2">
          {updateMutation.isPending ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              <Loader2 className="h-3 w-3 animate-spin" />
              Išsaugoma...
            </span>
          ) : isPendingSave ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <CloudLightning className="h-3 w-3" />
              Laukiama išsaugojimo...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              <CheckCircle2 className="h-3 w-3" />
              Išsaugota Drive
            </span>
          )}
        </div>

        {client ? (
          <InvoiceActions
            invoice={localInvoice}
            client={client}
            settings={settings}
          />
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100 font-medium">
            Pasirinkite klientą, kad galėtumėte eksportuoti
          </div>
        )}
      </header>

      {/* Redaktoriaus pagrindinis vaizdas */}
      <div className="flex flex-row flex-grow h-[calc(100vh-57px)] overflow-hidden print:h-auto print:overflow-visible">
        {/* Kairysis dizaino skydelis */}
        <DesignSidebar
          invoice={localInvoice}
          onChange={setLocalInvoice}
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        {/* Centrinė sąskaitos drobė */}
        <main className="flex-grow overflow-y-auto p-8 flex justify-center bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
          <InvoiceCanvas
            invoice={localInvoice}
            onChange={setLocalInvoice}
            settings={settings}
          />
        </main>
      </div>
    </div>
  );
}
