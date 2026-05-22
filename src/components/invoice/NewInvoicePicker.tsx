import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ClientCombobox } from '@/components/shared';
import { ClientId } from '@/lib/domain';
import { useClients } from '@/hooks';

export interface NewInvoicePickerProps {
  onClientSelected: (clientId: ClientId) => void;
  isPending: boolean;
}

export function NewInvoicePicker({ onClientSelected, isPending }: NewInvoicePickerProps) {
  const { clients } = useClients();

  const handleChange = (val: string | null) => {
    if (!val) return;
    const client = clients.find((c) => c.id.toString() === val);
    if (client) onClientSelected(client.id);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-xl font-bold text-slate-900">Nauja sąskaita-faktūra</h2>
          <p className="text-sm text-slate-500">Pasirinkite klientą, kuriam norite išrašyti naują sąskaitą.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Klientas</label>
          <ClientCombobox value={null} onChange={handleChange} placeholder="Pasirinkite iš sąrašo..." />
        </div>

        {isPending && (
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
