import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { InvoiceStatus } from '@/lib/domain';
import { ALL_STATUSES, statusMeta } from './statusMeta';

export interface StatusPickerProps {
  value: InvoiceStatus;
  onChange: (next: InvoiceStatus) => void;
  disabled?: boolean;
}

export function StatusPicker({ value, onChange, disabled }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = statusMeta(value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handlePick = (next: InvoiceStatus) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badgeClass} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90'}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
        {meta.label}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {ALL_STATUSES.map((s) => {
            const m = statusMeta(s);
            const active = s === value;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handlePick(s)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${m.dotClass}`} />
                  {m.label}
                </span>
                {active ? <Check className="h-3.5 w-3.5 text-slate-600" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
