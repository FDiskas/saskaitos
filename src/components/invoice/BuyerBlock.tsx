import { useMemo } from 'react';
import { type Invoice } from '@/lib/domain';
import { useClients, useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';

export interface BuyerBlockProps {
  invoice: Invoice;
}

export function BuyerBlock({ invoice }: BuyerBlockProps) {
  const { clients } = useClients();
  const t = useTranslate();
  const client = useMemo(
    () => clients.find((c) => c.id.equals(invoice.clientId)) || null,
    [invoice.clientId, clients],
  );

  if (!client) {
    return (
      <div className="flex w-full flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t['invoice.buyer.title']}</h2>
        <p className="text-xs italic text-slate-400">{t['invoice.buyer.missingClient']}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t['invoice.buyer.title']}</h2>
      <div className="text-xs text-slate-700 leading-relaxed">
        <p className="font-bold text-slate-900 text-sm">{client.name}</p>
        {client.code && <p>{withParams(t['invoice.seller.companyCode'], { code: client.code })}</p>}
        {client.vatCode && <p>{withParams(t['invoice.seller.vatCode'], { code: client.vatCode })}</p>}
        <p>{client.address}</p>
        {client.email && <p>{withParams(t['invoice.seller.email'], { email: client.email })}</p>}
        {client.phone && <p>{withParams(t['invoice.seller.phone'], { phone: client.phone })}</p>}
      </div>
    </div>
  );
}
