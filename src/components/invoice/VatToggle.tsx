import { type Invoice, VatRate, type VatPercent } from '@/lib/domain';
import { useTranslate } from '@/hooks';

export interface VatToggleProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  isPreview?: boolean;
}

export function VatToggle({ invoice, onChange, isPreview = false }: VatToggleProps) {
  const t = useTranslate();
  if (isPreview) {
    return null;
  }

  const hasVat = invoice.vat.enabled;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onChange(invoice.withVat(VatRate.of(21)));
      return;
    }
    onChange(invoice.withVatDisabled());
  };

  const handleRateChange = (percent: VatPercent) => {
    onChange(invoice.withVat(VatRate.of(percent)));
  };

  return (
    <div className="flex items-center gap-4 text-xs no-print bg-slate-50 p-2 rounded border border-slate-200">
      <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={hasVat}
          onChange={(e) => handleToggle(e.target.checked)}
          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
        />
        {t['invoice.vat.toggleLabel']}
      </label>

      {hasVat && (
        <select
          value={invoice.vat.rate.percent}
          onChange={(e) => handleRateChange(parseInt(e.target.value, 10) as VatPercent)}
          className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
        >
          <option value={21}>21%</option>
          <option value={9}>9%</option>
          <option value={5}>5%</option>
          <option value={0}>0%</option>
        </select>
      )}
    </div>
  );
}
