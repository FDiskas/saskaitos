import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useTranslate } from '@/hooks';
import type { InvoiceStatus } from '@/lib/domain';
import { ALL_STATUSES, statusMeta } from './statusMeta';

export interface StatusMultiSelectProps {
  value: InvoiceStatus[];
  onChange: (next: InvoiceStatus[]) => void;
  placeholder?: string;
}

export function StatusMultiSelect({
  value,
  onChange,
  placeholder,
}: StatusMultiSelectProps) {
  const t = useTranslate();
  const effectivePlaceholder = placeholder ?? t['dashboard.filters.allStatuses'];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = (s: InvoiceStatus) => {
    if (value.includes(s)) onChange(value.filter((x) => x !== s));
    else onChange([...value, s]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const label =
    value.length === 0
      ? effectivePlaceholder
      : value.map((s) => statusMeta(s, t).label).join(', ');

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
      >
        <span className={value.length === 0 ? 'text-slate-500' : 'text-slate-900 truncate'}>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {value.length > 0 ? (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => {
                if (e.key === 'Enter') clear(e as unknown as React.MouseEvent);
              }}
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {ALL_STATUSES.map((s) => {
            const m = statusMeta(s, t);
            const active = value.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
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
