import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslate } from '@/hooks';
import type { InvoiceStatus } from '@/lib/domain';
import { ALL_STATUSES, statusMeta } from './statusMeta';

export interface StatusPickerProps {
  value: InvoiceStatus;
  onChange: (next: InvoiceStatus) => void;
  disabled?: boolean;
}

interface MenuCoords {
  top: number;
  right: number;
}

export function StatusPicker({ value, onChange, disabled }: StatusPickerProps) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = statusMeta(value, t);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((prev) => !prev);
  };

  const handlePick = (next: InvoiceStatus) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badgeClass} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90'}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
        {meta.label}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              style={{ position: 'fixed', top: coords.top, right: coords.right }}
              className="z-50 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            >
              {ALL_STATUSES.map((s) => {
                const m = statusMeta(s, t);
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
