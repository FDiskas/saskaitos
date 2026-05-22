import { type CSSProperties } from 'react';
import { type Invoice } from '@/lib/domain';
import { moneyToWordsLt } from '@/lib/format/moneyWordsLt';

export interface AmountInWordsBlockProps {
  invoice: Invoice;
  align: 'left' | 'center' | 'right';
  textColor?: string;
}

export function AmountInWordsBlock({ invoice, align, textColor }: AmountInWordsBlockProps) {
  const amountInWords = moneyToWordsLt(invoice.totals().total);
  const style: CSSProperties = {
    textAlign: align,
    color: textColor,
  };

  return (
    <div className="w-full border-t border-slate-100 pt-2 text-[11px] leading-snug" style={style}>
      <span className="font-medium">Suma žodžiais:</span> {amountInWords}
    </div>
  );
}
