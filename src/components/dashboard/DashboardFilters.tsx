import { Search } from 'lucide-react';
import { Input } from '@/components/ui';
import { ClientCombobox } from '@/components/shared';
import { useTranslate } from '@/hooks';
import { ClientId, type InvoiceStatus } from '@/lib/domain';
import { StatusMultiSelect } from './StatusMultiSelect';

export interface DashboardFilterValues {
  search: string;
  clientId: ClientId | null;
  statuses: InvoiceStatus[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

export interface DashboardFiltersProps {
  values: DashboardFilterValues;
  onChange: (next: DashboardFilterValues) => void;
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInputDate(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export function DashboardFilters({ values, onChange }: DashboardFiltersProps) {
  const t = useTranslate();
  const patch = (p: Partial<DashboardFilterValues>) => onChange({ ...values, ...p });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder={t['dashboard.filters.searchPlaceholder']}
          value={values.search}
          onChange={(e) => patch({ search: e.target.value })}
          className="bg-white pl-9"
        />
      </div>

      <ClientCombobox
        value={values.clientId ? values.clientId.toString() : null}
        onChange={(id) => patch({ clientId: id ? ClientId.fromString(id) : null })}
        placeholder={t['dashboard.filters.allClients']}
      />

      <StatusMultiSelect
        value={values.statuses}
        onChange={(statuses) => patch({ statuses })}
      />

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={toInputDate(values.dateFrom)}
          onChange={(e) => patch({ dateFrom: parseDate(e.target.value) })}
          className="bg-white"
        />
        <span className="text-xs text-slate-400">–</span>
        <Input
          type="date"
          value={toInputDate(values.dateTo)}
          onChange={(e) => patch({ dateTo: parseDate(e.target.value) })}
          className="bg-white"
        />
      </div>
    </div>
  );
}
