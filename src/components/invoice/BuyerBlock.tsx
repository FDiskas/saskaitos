import { useMemo } from 'react';
import { Invoice, ClientId } from '@/lib/domain';
import { useClients } from '@/hooks';
import { ClientCombobox } from '@/components/shared';

export interface BuyerBlockProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  isPreview?: boolean;
}

export function BuyerBlock({ invoice, onChange, isPreview = false }: BuyerBlockProps) {
  const { clients } = useClients();
  const client = useMemo(
    () => clients.find((c) => c.id.equals(invoice.clientId)) || null,
    [invoice.clientId, clients],
  );

  if (!client) {
    if (isPreview) {
      return (
        <div className="flex w-full flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Pirkėjas</h2>
          <p className="text-xs italic text-slate-400">Klientas nepasirinktas</p>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pirkėjas</h2>
        <div className="w-full max-w-sm mt-1">
          <ClientCombobox
            value={null}
            onChange={(val) => val && onChange(invoice.withClientId(ClientId.fromString(val)))}
            placeholder="Pasirinkite klientą..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pirkėjas</h2>
      <div className="text-xs text-slate-700 leading-relaxed relative group">
        {!isPreview && (
          <div className="no-print absolute -right-6 -top-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onChange(invoice.withClientId(ClientId.fromString('')))}
              className="cursor-pointer text-[10px] text-blue-600 hover:underline"
            >
              Pakeisti
            </button>
          </div>
        )}
        <p className="font-bold text-slate-900 text-sm">{client.name}</p>
        {client.code && <p>Įmonės kodas: {client.code}</p>}
        {client.vatCode && <p>PVM kodas: {client.vatCode}</p>}
        <p>{client.address}</p>
        {client.email && <p>El. paštas: {client.email}</p>}
        {client.phone && <p>Tel.: {client.phone}</p>}
      </div>
    </div>
  );
}
