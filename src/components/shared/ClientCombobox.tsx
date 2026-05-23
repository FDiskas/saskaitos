import { useMemo } from 'react';
import { useClients } from '@/hooks';
import { Combobox, type ComboboxItem } from '@/components/ui';

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
  className,
}: ClientComboboxProps) {
  const { clients, isLoading } = useClients();

  const items = useMemo<ComboboxItem[]>(
    () =>
      clients.map((c) => ({
        value: c.id.toString(),
        label: c.name,
        subtitle: c.code ? `Įm. kodas: ${c.code}` : undefined,
      })),
    [clients],
  );

  return (
    <Combobox
      value={value}
      onChange={onChange}
      items={items}
      isLoading={isLoading}
      placeholder={placeholder}
      searchPlaceholder="Ieškoti kliento..."
      emptyText="Nėra rasta klientų."
      className={className}
    />
  );
}
