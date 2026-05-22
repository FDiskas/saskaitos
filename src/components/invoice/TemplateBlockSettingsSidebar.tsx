import type { InvoiceTemplateLayoutDto, TemplateBlockId } from '@/lib/invoice-template/layout';
import { blockLabel } from '@/lib/invoice-template/blocks';
import { Button } from '@/components/ui';

export interface TemplateBlockSettingsSidebarProps {
  selectedBlockId: TemplateBlockId | null;
  selectedRowId: string | null;
  layout: InvoiceTemplateLayoutDto;
  onAlignChange: (align: 'left' | 'center' | 'right') => void;
  onMarginTopChange: (value: number) => void;
  onMarginBottomChange: (value: number) => void;
  onRemoveBlock: () => void;
  onRowColumnsChange: (columns: number) => void;
  onRemoveRow: () => void;
}

export function TemplateBlockSettingsSidebar({
  selectedBlockId,
  selectedRowId,
  layout,
  onAlignChange,
  onMarginTopChange,
  onMarginBottomChange,
  onRemoveBlock,
  onRowColumnsChange,
  onRemoveRow,
}: TemplateBlockSettingsSidebarProps) {
  if (!selectedBlockId && !selectedRowId) {
    return (
      <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nustatymai</h3>
        <p className="text-xs text-slate-500">
          Pasirinkite bloką arba eilutę drobėje, kad galėtumėte keisti nustatymus.
        </p>
      </aside>
    );
  }

  if (!selectedBlockId && selectedRowId) {
    const selectedRow = layout.layout.find((row) => row.id === selectedRowId);

    if (!selectedRow) {
      return (
        <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Eilutės nustatymai</h3>
          <p className="text-xs text-slate-500">Pasirinkta eilutė nerasta.</p>
        </aside>
      );
    }

    return (
      <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Eilutės nustatymai</h3>
        <p className="text-sm font-semibold text-slate-900 mb-4">Eilutė</p>

        <label className="text-xs font-medium text-slate-600 mb-1 block">Stulpeliai</label>
        <select
          className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-4"
          value={selectedRow.columns.length}
          onChange={(event) => onRowColumnsChange(Number(event.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>

        <Button type="button" variant="destructive" className="w-full" onClick={onRemoveRow}>
          Pašalinti eilutę
        </Button>
      </aside>
    );
  }

  const settings = layout.blockSettings[selectedBlockId] ?? {
    align: 'left' as const,
    marginTop: 0,
    marginBottom: 0,
  };

  return (
    <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bloko nustatymai</h3>
      <p className="text-sm font-semibold text-slate-900 mb-4">{blockLabel(selectedBlockId)}</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Lygiavimas</label>
      <select
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-4"
        value={settings.align}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'left' || value === 'center' || value === 'right') {
            onAlignChange(value);
          }
        }}
      >
        <option value="left">Kairė</option>
        <option value="center">Centras</option>
        <option value="right">Dešinė</option>
      </select>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Viršutinis tarpas: {settings.marginTop}px</label>
      <input
        type="range"
        min={0}
        max={120}
        value={settings.marginTop}
        onChange={(event) => onMarginTopChange(Number(event.target.value))}
        className="w-full mb-4"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">Apatinis tarpas: {settings.marginBottom}px</label>
      <input
        type="range"
        min={0}
        max={120}
        value={settings.marginBottom}
        onChange={(event) => onMarginBottomChange(Number(event.target.value))}
        className="w-full mb-4"
      />

      <Button type="button" variant="destructive" className="w-full" onClick={onRemoveBlock}>
        Pašalinti bloką
      </Button>
    </aside>
  );
}
