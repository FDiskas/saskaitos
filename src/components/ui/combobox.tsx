import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

export interface ComboboxItem {
  value: string;
  label: string;
  subtitle?: string;
}

export interface ComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  items: ReadonlyArray<ComboboxItem>;
  isLoading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  allowClear?: boolean;
}

function matches(item: ComboboxItem, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.subtitle && item.subtitle.toLowerCase().includes(q)) return true;
  return false;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void): void {
  useEffect(() => {
    function handle(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onOutside]);
}

interface DropdownPanelProps {
  filtered: ReadonlyArray<ComboboxItem>;
  selectedValue: string | null;
  searchPlaceholder: string;
  emptyText: string;
  search: string;
  onSearch: (q: string) => void;
  onPick: (value: string) => void;
}

function DropdownPanel({
  filtered,
  selectedValue,
  searchPlaceholder,
  emptyText,
  search,
  onSearch,
  onPick,
}: DropdownPanelProps) {
  return (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg focus:outline-none flex flex-col">
      <div className="flex items-center border-b border-slate-100 px-3 py-2">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="flex h-7 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
          autoFocus
        />
      </div>
      <div className="overflow-y-auto max-h-48 py-1">
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">{emptyText}</div>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedValue === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onPick(item.value)}
                className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 text-left ${
                  isSelected ? 'bg-slate-50 font-medium text-slate-900' : 'text-slate-700'
                }`}
              >
                <Check className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  {item.subtitle && (
                    <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Combobox({
  value,
  onChange,
  items,
  isLoading = false,
  placeholder = 'Pasirinkite...',
  searchPlaceholder = 'Ieškoti...',
  emptyText = 'Nieko nerasta.',
  className = '',
  allowClear = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const selected = useMemo(
    () => (value === null ? null : items.find((i) => i.value === value) ?? null),
    [value, items],
  );

  const filtered = useMemo(() => items.filter((i) => matches(i, search)), [items, search]);

  function handlePick(next: string): void {
    onChange(next);
    setIsOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent | React.KeyboardEvent): void {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 text-left"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-500'}>
          {isLoading ? 'Kraunama...' : selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5">
          {selected && allowClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e);
              }}
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </button>
      {isOpen && (
        <DropdownPanel
          filtered={filtered}
          selectedValue={value}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          search={search}
          onSearch={setSearch}
          onPick={handlePick}
        />
      )}
    </div>
  );
}
