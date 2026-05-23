import { useState, type ChangeEvent } from 'react';
import { Discount, type Invoice, Money } from '@/lib/domain';

export interface DiscountToggleProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  isPreview?: boolean;
}

type DiscountUiKind = 'percent' | 'fixed';

function discountKindOf(discount: Discount): DiscountUiKind {
  return discount.kind === 'fixed' ? 'fixed' : 'percent';
}

function discountRawValueOf(discount: Discount): string {
  if (discount.kind === 'percent') return String(discount.percent);
  if (discount.kind === 'fixed') return discount.amount.toNumber().toString();
  return '';
}

export function DiscountToggle({ invoice, onChange, isPreview = false }: DiscountToggleProps) {
  const persistedEnabled = !invoice.discount.isZero();
  const [enabledLocal, setEnabledLocal] = useState(persistedEnabled);
  const [draftKind, setDraftKind] = useState<DiscountUiKind>(discountKindOf(invoice.discount));
  const [draftValue, setDraftValue] = useState<string>(discountRawValueOf(invoice.discount));
  const currency = invoice.totals().subtotal.currency;

  if (isPreview) return null;

  const enabled = enabledLocal || persistedEnabled;

  const handleEnable = (next: boolean) => {
    setEnabledLocal(next);
    if (!next) {
      onChange(invoice.withDiscount(Discount.none()));
      setDraftValue('');
      return;
    }
    onChange(invoice.withDiscount(buildDiscount(draftKind, draftValue, currency)));
  };

  const handleKindChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKind = event.target.value as DiscountUiKind;
    setDraftKind(nextKind);
    onChange(invoice.withDiscount(buildDiscount(nextKind, draftValue, currency)));
  };

  const handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setDraftValue(raw);
    onChange(invoice.withDiscount(buildDiscount(draftKind, raw, currency)));
  };

  return (
    <div className="flex items-center gap-3 text-xs no-print bg-slate-50 p-2 rounded border border-slate-200 flex-wrap">
      <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => handleEnable(event.target.checked)}
          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
        />
        Nuolaida
      </label>

      {enabled && (
        <>
          <select
            value={draftKind}
            onChange={handleKindChange}
            className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="percent">%</option>
            <option value="fixed">EUR</option>
          </select>
          <input
            type="number"
            min={0}
            max={draftKind === 'percent' ? 100 : undefined}
            step={draftKind === 'percent' ? 1 : 0.01}
            value={draftValue}
            onChange={handleValueChange}
            placeholder="0"
            className="w-20 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </>
      )}
    </div>
  );
}

function buildDiscount(kind: DiscountUiKind, raw: string, currency: string): Discount {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return Discount.none();
  if (kind === 'percent') {
    const clamped = Math.min(100, Math.max(0, value));
    return Discount.percent(clamped);
  }
  return Discount.fixed(new Money(value, currency));
}
