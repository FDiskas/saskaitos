import { useMemo } from 'react';
import { type Invoice } from '@/lib/domain';
import { useClients } from '@/hooks';

export interface BuyerBlockProps {
  invoice: Invoice;
}

export function BuyerBlock({ invoice }: BuyerBlockProps) {
  const { clients } = useClients();
  const client = useMemo(
    () => clients.find((c) => c.id.equals(invoice.clientId)) || null,
    [invoice.clientId, clients],
  );

  if (!client) {
    return (
      <div className="flex w-full flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pirkėjas</h2>
        <p className="text-xs italic text-slate-400">Klientas nepasirinktas</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pirkėjas</h2>
      <div className="text-xs text-slate-700 leading-relaxed">
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
