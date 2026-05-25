import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useTranslate } from '@/hooks';
import type { SeriesDto } from '@/lib/drive/schemas';

export interface SeriesTabProps {
  series: SeriesDto[];
  onChange: (next: SeriesDto[]) => void;
}

interface DraftSeries {
  prefix: string;
  nextNumber: string;
}

const EMPTY_DRAFT: DraftSeries = { prefix: '', nextNumber: '1' };

export function SeriesTab({ series, onChange }: SeriesTabProps) {
  const t = useTranslate();
  const [draft, setDraft] = useState<DraftSeries>(EMPTY_DRAFT);

  function updateRow(id: string, patch: Partial<SeriesDto>): void {
    onChange(series.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function makeDefault(id: string): void {
    onChange(series.map((s) => ({ ...s, isDefault: s.id === id })));
  }

  function removeRow(id: string): void {
    const row = series.find((s) => s.id === id);
    if (!row || row.isDefault) return;
    onChange(series.filter((s) => s.id !== id));
  }

  function addRow(): void {
    const prefix = draft.prefix.trim();
    const nextNumber = Number(draft.nextNumber);
    if (prefix.length === 0 || !Number.isInteger(nextNumber) || nextNumber < 1) return;
    const newRow: SeriesDto = {
      id: crypto.randomUUID(),
      prefix,
      nextNumber,
      isDefault: series.length === 0,
    };
    onChange([...series, newRow]);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">{t['settings.series.head.prefix']}</th>
              <th className="px-4 py-2">{t['settings.series.head.nextNumber']}</th>
              <th className="px-4 py-2">{t['settings.series.head.default']}</th>
              <th className="px-4 py-2 text-right">{t['settings.series.head.actions']}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {series.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  {t['settings.series.empty']}
                </td>
              </tr>
            ) : null}
            {series.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <Input
                    value={row.prefix}
                    onChange={(e) => updateRow(row.id, { prefix: e.target.value })}
                  />
                </td>
                <td className="px-4 py-2 w-32">
                  <Input
                    type="number"
                    min={1}
                    value={row.nextNumber}
                    onChange={(e) => updateRow(row.id, { nextNumber: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="radio"
                    name="default-series"
                    checked={row.isDefault}
                    onChange={() => makeDefault(row.id)}
                    aria-label={t['settings.series.defaultRadioLabel']}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    disabled={row.isDefault}
                    title={row.isDefault ? t['settings.series.deleteDisabled'] : t['settings.series.deleteTitle']}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
        <h4 className="text-sm font-semibold text-slate-700">{t['settings.series.addTitle']}</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr,140px,auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="series-prefix">{t['settings.series.head.prefix']}</Label>
            <Input
              id="series-prefix"
              placeholder={t['settings.series.addPrefixPlaceholder']}
              value={draft.prefix}
              onChange={(e) => setDraft((d) => ({ ...d, prefix: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="series-next">{t['settings.series.head.nextNumber']}</Label>
            <Input
              id="series-next"
              type="number"
              min={1}
              value={draft.nextNumber}
              onChange={(e) => setDraft((d) => ({ ...d, nextNumber: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addRow}>
              <Plus className="h-4 w-4" /> {t['settings.series.addButton']}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
