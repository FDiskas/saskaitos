import { type Invoice } from '@/lib/domain';
import { useTranslate } from '@/hooks';

export interface TotalsBoxProps {
  invoice: Invoice;
  accentColor?: string;
}

export function TotalsBox({ invoice, accentColor }: TotalsBoxProps) {
  const t = useTranslate();
  const totals = invoice.totals();
  const hasVat = invoice.vat.enabled;
  const hasDiscount = !invoice.discount.isZero();

  return (
    <div className="w-full flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-right">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{t['invoice.totals.subtotal']}</span>
        <span className="font-mono">{totals.subtotal.format()}</span>
      </div>
      {hasDiscount && (
        <>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{t['invoice.totals.discount']}{describeDiscount(invoice)}:</span>
            <span className="font-mono">−{totals.discountAmount.format()}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{t['invoice.totals.taxableAmount']}</span>
            <span className="font-mono">{totals.taxableAmount.format()}</span>
          </div>
        </>
      )}
      {hasVat && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{t['invoice.totals.vat']}</span>
          <span className="font-mono">{totals.vatAmount.format()}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold border-t border-double border-slate-300 pt-2 text-slate-900">
        <span>{t['invoice.totals.total']}</span>
        <span className="font-mono text-base" style={{ color: accentColor }}>
          {totals.total.format()}
        </span>
      </div>
    </div>
  );
}

function describeDiscount(invoice: Invoice): string {
  if (invoice.discount.kind === 'percent') return ` (${invoice.discount.percent}%)`;
  return '';
}
