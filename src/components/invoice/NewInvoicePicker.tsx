import { useState } from 'react';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ClientCombobox } from '@/components/shared';
import { ClientFormDialog, type ClientFormValues } from '@/components/clients';
import { Client, ClientId } from '@/lib/domain';
import { useClients, useCreateClient, useTranslate } from '@/hooks';

export interface NewInvoicePickerProps {
  onClientSelected: (clientId: ClientId) => void;
  isPending: boolean;
}

export function NewInvoicePicker({ onClientSelected, isPending }: NewInvoicePickerProps) {
  const { clients } = useClients();
  const createClient = useCreateClient();
  const t = useTranslate();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSelectExisting = (val: string | null) => {
    if (!val) return;
    const client = clients.find((c) => c.id.toString() === val);
    if (client) onClientSelected(client.id);
  };

  const handleCreateAndSelect = (values: ClientFormValues) => {
    const created = clientFromForm(values);
    createClient.mutate(created);
    setIsFormOpen(false);
    onClientSelected(created.id);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-xl font-bold text-slate-900">{t['invoice.picker.title']}</h2>
          <p className="text-sm text-slate-500">{t['invoice.picker.lead']}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t['invoice.picker.clientLabel']}</label>
          <ClientCombobox value={null} onChange={handleSelectExisting} placeholder={t['invoice.picker.clientPlaceholder']} />
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t['invoice.picker.createClient']}
          </button>
        </div>

        {isPending && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 py-2 rounded-md border border-slate-150">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            {t['invoice.picker.pending']}
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> {t['invoice.picker.cancel']}
          </Link>
        </div>
      </div>

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingClient={null}
        onSave={handleCreateAndSelect}
        isSaving={createClient.isPending}
      />
    </div>
  );
}

function clientFromForm(values: ClientFormValues): Client {
  const now = new Date();
  return Client.of({
    id: ClientId.create(),
    name: values.name,
    code: values.code || undefined,
    vatCode: values.vatCode || undefined,
    address: values.address,
    email: values.email || undefined,
    phone: values.phone || undefined,
    contactPerson: values.contactPerson || undefined,
    notes: values.notes || undefined,
    createdAt: now,
    updatedAt: now,
  });
}
