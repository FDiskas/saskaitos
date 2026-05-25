import { useMemo } from 'react';
import { useClients, useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';
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
  placeholder,
  className,
}: ClientComboboxProps) {
  const { clients, isLoading } = useClients();
  const t = useTranslate();
  const effectivePlaceholder = placeholder ?? (t['combobox.client.placeholder'] as string);

  const items = useMemo<ComboboxItem[]>(
    () =>
      clients.map((c) => ({
        value: c.id.toString(),
        label: c.name,
        subtitle: c.code ? withParams(t['combobox.client.codePrefix'], { code: c.code }) : undefined,
      })),
    [clients, t],
  );

  return (
    <Combobox
      value={value}
      onChange={onChange}
      items={items}
      isLoading={isLoading}
      placeholder={effectivePlaceholder}
      searchPlaceholder={t['combobox.client.searchPlaceholder']}
      emptyText={t['combobox.client.empty']}
      className={className}
    />
  );
}
