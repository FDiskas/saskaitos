import { useState, useMemo, useRef, useEffect } from 'react';
import { useClients } from '@/hooks';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

export interface ClientComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function ClientCombobox({
  value,
  onChange,
  placeholder = 'Pasirinkite klientą...',
  className = '',
}: ClientComboboxProps) {
  const { clients, isLoading } = useClients();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedClient = useMemo(() => {
    if (!value) return null;
    return clients.find((c) => c.id.toString() === value) ?? null;
  }, [value, clients]);

  const filteredClients = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return clients;
    return clients.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(query);
      const codeMatch = c.code?.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });
  }, [search, clients]);

  const handleSelect = (clientId: string) => {
    onChange(clientId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 text-left"
        disabled={isLoading}
      >
        <span className={selectedClient ? 'text-slate-900' : 'text-slate-500'}>
          {isLoading
            ? 'Kraunama...'
            : selectedClient
              ? selectedClient.name
              : placeholder}
        </span>
        <div className="flex items-center gap-1.5">
          {selectedClient && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg focus:outline-none flex flex-col">
          {/* Search bar */}
          <div className="flex items-center border-b border-slate-100 px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder="Ieškoti kliento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-7 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* List items */}
          <div className="overflow-y-auto max-h-48 py-1">
            {filteredClients.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">Nėra rasta klientų.</div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.id.equals(client.id);
                return (
                  <button
                    key={client.id.toString()}
                    type="button"
                    onClick={() => handleSelect(client.id.toString())}
                    className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 text-left ${
                      isSelected ? 'bg-slate-50 font-medium text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      {client.code && (
                        <span className="text-[10px] text-slate-400">Įm. kodas: {client.code}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
