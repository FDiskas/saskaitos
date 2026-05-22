import { Invoice } from '@/lib/domain';

export interface TotalsBoxProps {
  invoice: Invoice;
  accentColor?: string;
}

export function TotalsBox({ invoice, accentColor }: TotalsBoxProps) {
  const totals = invoice.totals();
  const hasVat = invoice.vat.enabled;

  return (
    <div className="w-full flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-right">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Tarpinė suma:</span>
        <span className="font-mono">{totals.subtotal.format()}</span>
      </div>
      {hasVat && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>PVM suma:</span>
          <span className="font-mono">{totals.vatAmount.format()}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold border-t border-double border-slate-300 pt-2 text-slate-900">
        <span>Iš viso:</span>
        <span className="font-mono text-base" style={{ color: accentColor }}>
          {totals.total.format()}
        </span>
      </div>
    </div>
  );
}
