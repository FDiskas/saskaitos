import { type ChangeEvent } from 'react';
import { Button } from '@/components/ui';
import { blockLabel } from '@/lib/invoice-template/blocks';
import { rowTotalSpan } from '@/lib/invoice-template/layout';
import type {
  BlockInstance,
  DividerBlockInstance,
  CustomImageBlockInstance,
  InvoiceTemplateLayoutDto,
  InvoiceTemplateRowDto,
  TextBlockInstance,
} from '@/lib/invoice-template/layout';
import { useTextDraft } from './useTextDraft';
import { useCommittedValueDraft } from './useCommittedValueDraft';

export interface TemplateBlockSettingsSidebarProps {
  selectedInstance: BlockInstance | null;
  selectedRowId: string | null;
  layout: InvoiceTemplateLayoutDto;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
  onRemoveInstance: () => void;
  onRowColumnsChange: (columns: number) => void;
  onMergeColumnRight: (columnId: string) => void;
  onSplitColumn: (columnId: string) => void;
  onRemoveRow: () => void;
}

export function TemplateBlockSettingsSidebar({
  selectedInstance,
  selectedRowId,
  layout,
  onInstancePatch,
  onRemoveInstance,
  onRowColumnsChange,
  onMergeColumnRight,
  onSplitColumn,
  onRemoveRow,
}: TemplateBlockSettingsSidebarProps) {
  if (!selectedInstance && !selectedRowId) {
    return (
      <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nustatymai</h3>
        <p className="text-xs text-slate-500">
          Pasirinkite bloką arba eilutę drobėje, kad galėtumėte keisti nustatymus.
        </p>
      </aside>
    );
  }

  if (!selectedInstance && selectedRowId) {
    return (
      <RowSettingsPanel
        rowId={selectedRowId}
        layout={layout}
        onRowColumnsChange={onRowColumnsChange}
        onMergeColumnRight={onMergeColumnRight}
        onSplitColumn={onSplitColumn}
        onRemoveRow={onRemoveRow}
      />
    );
  }

  if (!selectedInstance) return null;

  return (
    <InstanceSettingsPanel
      instance={selectedInstance}
      onInstancePatch={onInstancePatch}
      onRemoveInstance={onRemoveInstance}
    />
  );
}

interface RowSettingsPanelProps {
  rowId: string;
  layout: InvoiceTemplateLayoutDto;
  onRowColumnsChange: (columns: number) => void;
  onMergeColumnRight: (columnId: string) => void;
  onSplitColumn: (columnId: string) => void;
  onRemoveRow: () => void;
}

function RowSettingsPanel({
  rowId,
  layout,
  onRowColumnsChange,
  onMergeColumnRight,
  onSplitColumn,
  onRemoveRow,
}: RowSettingsPanelProps) {
  const selectedRow = layout.layout.find((row) => row.id === rowId);
  if (!selectedRow) {
    return (
      <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Eilutės nustatymai</h3>
        <p className="text-xs text-slate-500">Pasirinkta eilutė nerasta.</p>
      </aside>
    );
  }

  const totalSpan = rowTotalSpan(selectedRow);

  return (
    <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Eilutės nustatymai</h3>
      <p className="text-sm font-semibold text-slate-900 mb-4">Eilutė</p>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Stulpelių struktūra</p>
      <ColumnLayoutPreview row={selectedRow} totalSpan={totalSpan} />

      <div className="flex flex-col gap-2 mb-4">
        {selectedRow.columns.map((column, index) => (
          <ColumnControls
            key={column.id}
            column={column}
            isLast={index === selectedRow.columns.length - 1}
            onMergeRight={() => onMergeColumnRight(column.id)}
            onSplit={() => onSplitColumn(column.id)}
            index={index}
          />
        ))}
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Greitas išdėstymas</p>
      <div className="grid grid-cols-4 gap-1 mb-4">
        {[1, 2, 3, 4].map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-md border px-2 py-1.5 text-sm font-medium ${
              selectedRow.columns.length === value && totalSpan === value
                ? 'border-sky-400 bg-sky-50 text-sky-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => onRowColumnsChange(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <Button type="button" variant="destructive" className="w-full" onClick={onRemoveRow}>
        Pašalinti eilutę
      </Button>
    </aside>
  );
}

interface ColumnLayoutPreviewProps {
  row: InvoiceTemplateRowDto;
  totalSpan: number;
}

function ColumnLayoutPreview({ row, totalSpan }: ColumnLayoutPreviewProps) {
  return (
    <div
      className="grid gap-0.5 mb-3 rounded border border-slate-200 bg-slate-50 p-1"
      style={{ gridTemplateColumns: `repeat(${totalSpan}, minmax(0, 1fr))` }}
    >
      {row.columns.map((column, index) => (
        <div
          key={column.id}
          className="flex items-center justify-center rounded bg-white border border-slate-200 px-1 py-2 text-[10px] font-medium text-slate-500"
          style={{ gridColumn: `span ${column.span} / span ${column.span}` }}
        >
          {index + 1}
          {column.span > 1 ? `×${column.span}` : ''}
        </div>
      ))}
    </div>
  );
}

interface ColumnControlsProps {
  column: InvoiceTemplateRowDto['columns'][number];
  index: number;
  isLast: boolean;
  onMergeRight: () => void;
  onSplit: () => void;
}

function ColumnControls({ column, index, isLast, onMergeRight, onSplit }: ColumnControlsProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">
        Stulpelis {index + 1}
        {column.span > 1 ? ` (plotis ${column.span})` : ''}
      </p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={isLast}
          onClick={onMergeRight}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Sujungti su dešiniu stulpeliu"
        >
          Sujungti dešiniau →
        </button>
        <button
          type="button"
          disabled={column.span <= 1}
          onClick={onSplit}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Padalinti į atskirus stulpelius"
        >
          Padalinti
        </button>
      </div>
    </div>
  );
}

interface InstanceSettingsPanelProps {
  instance: BlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
  onRemoveInstance: () => void;
}

function InstanceSettingsPanel({ instance, onInstancePatch, onRemoveInstance }: InstanceSettingsPanelProps) {
  const marginTopDraft = useCommittedValueDraft(instance.marginTop, (nextMarginTop) => {
    onInstancePatch({ marginTop: nextMarginTop });
  });

  const marginBottomDraft = useCommittedValueDraft(instance.marginBottom, (nextMarginBottom) => {
    onInstancePatch({ marginBottom: nextMarginBottom });
  });

  return (
    <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bloko nustatymai</h3>
      <p className="text-sm font-semibold text-slate-900 mb-4">{blockLabel(instance.kind)}</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Lygiavimas</label>
      <select
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-4"
        value={instance.align}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'left' || value === 'center' || value === 'right') {
            onInstancePatch({ align: value });
          }
        }}
      >
        <option value="left">Kairė</option>
        <option value="center">Centras</option>
        <option value="right">Dešinė</option>
      </select>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Viršutinis tarpas: {marginTopDraft.value}px</label>
      <input
        type="range"
        min={0}
        max={120}
        value={marginTopDraft.value}
        onFocus={marginTopDraft.beginEditing}
        onChange={(event) => marginTopDraft.setValue(Number(event.target.value))}
        onMouseUp={marginTopDraft.commit}
        onTouchEnd={marginTopDraft.commit}
        onBlur={marginTopDraft.commit}
        className="w-full mb-4"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">Apatinis tarpas: {marginBottomDraft.value}px</label>
      <input
        type="range"
        min={0}
        max={120}
        value={marginBottomDraft.value}
        onFocus={marginBottomDraft.beginEditing}
        onChange={(event) => marginBottomDraft.setValue(Number(event.target.value))}
        onMouseUp={marginBottomDraft.commit}
        onTouchEnd={marginBottomDraft.commit}
        onBlur={marginBottomDraft.commit}
        className="w-full mb-4"
      />

      {instance.kind === 'divider' && <DividerControls instance={instance} onInstancePatch={onInstancePatch} />}
      {instance.kind === 'custom-image' && (
        <CustomImageControls instance={instance} onInstancePatch={onInstancePatch} />
      )}
      {instance.kind === 'text' && <TextControls instance={instance} onInstancePatch={onInstancePatch} />}

      <Button type="button" variant="destructive" className="w-full" onClick={onRemoveInstance}>
        Pašalinti bloką
      </Button>
    </aside>
  );
}

interface DividerControlsProps {
  instance: DividerBlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
}

function DividerControls({ instance, onInstancePatch }: DividerControlsProps) {
  const dividerThicknessDraft = useCommittedValueDraft(instance.dividerThickness, (nextThickness) => {
    onInstancePatch({ kind: 'divider', dividerThickness: nextThickness });
  });

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Skirtuko stilius</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Tipas</label>
      <select
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-3"
        value={instance.dividerStyle}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'solid' || value === 'dashed' || value === 'spacer') {
            onInstancePatch({ kind: 'divider', dividerStyle: value });
          }
        }}
      >
        <option value="solid">Ištisinė linija</option>
        <option value="dashed">Punktyrinė linija</option>
        <option value="spacer">Tuščia vieta</option>
      </select>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Storis: {dividerThicknessDraft.value}px</label>
      <input
        type="range"
        min={1}
        max={10}
        value={dividerThicknessDraft.value}
        onFocus={dividerThicknessDraft.beginEditing}
        onChange={(event) => dividerThicknessDraft.setValue(Number(event.target.value))}
        onMouseUp={dividerThicknessDraft.commit}
        onTouchEnd={dividerThicknessDraft.commit}
        onBlur={dividerThicknessDraft.commit}
        className="w-full mb-3"
      />

      {instance.dividerStyle !== 'spacer' && (
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="text-xs font-medium text-slate-600">Spalva</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={instance.dividerColor ?? '#cbd5e1'}
              onChange={(event) => onInstancePatch({ kind: 'divider', dividerColor: event.target.value })}
              className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
            />
            <button
              type="button"
              className="text-[10px] font-medium text-slate-500 hover:text-slate-900"
              onClick={() => onInstancePatch({ kind: 'divider', dividerColor: undefined })}
            >
              Iš šablono
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TextControlsProps {
  instance: TextBlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
}

function TextControls({ instance, onInstancePatch }: TextControlsProps) {
  const textDraft = useTextDraft(instance.text, (nextText) => {
    onInstancePatch({ kind: 'text', text: nextText });
  });

  const fontSizeDraft = useCommittedValueDraft(instance.fontSize, (nextFontSize) => {
    onInstancePatch({ kind: 'text', fontSize: nextFontSize });
  });

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Teksto stilius</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">Tekstas</label>
      <textarea
        value={textDraft.value}
        onChange={(event) => textDraft.setValue(event.target.value)}
        onFocus={textDraft.beginEditing}
        onBlur={textDraft.commit}
        rows={3}
        placeholder="Įveskite tekstą"
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-3 resize-y"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">Šriftas: {fontSizeDraft.value}px</label>
      <input
        type="range"
        min={8}
        max={48}
        value={fontSizeDraft.value}
        onFocus={fontSizeDraft.beginEditing}
        onChange={(event) => fontSizeDraft.setValue(Number(event.target.value))}
        onMouseUp={fontSizeDraft.commit}
        onTouchEnd={fontSizeDraft.commit}
        onBlur={fontSizeDraft.commit}
        className="w-full mb-3"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">Storis</label>
      <div className="flex gap-1 mb-3">
        {(['normal', 'bold'] as const).map((weight) => (
          <button
            key={weight}
            type="button"
            onClick={() => onInstancePatch({ kind: 'text', fontWeight: weight })}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
              instance.fontWeight === weight
                ? 'border-sky-400 bg-sky-50 text-sky-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {weight === 'normal' ? 'Įprastas' : 'Paryškintas'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <label className="text-xs font-medium text-slate-600">Spalva</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={instance.textColor ?? '#0f172a'}
            onChange={(event) => onInstancePatch({ kind: 'text', textColor: event.target.value })}
            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
          />
          <button
            type="button"
            className="text-[10px] font-medium text-slate-500 hover:text-slate-900"
            onClick={() => onInstancePatch({ kind: 'text', textColor: undefined })}
          >
            Iš šablono
          </button>
        </div>
      </div>
    </div>
  );
}

interface CustomImageControlsProps {
  instance: CustomImageBlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
}

function CustomImageControls({ instance, onInstancePatch }: CustomImageControlsProps) {
  const imageWidthDraft = useCommittedValueDraft(instance.imageMaxWidthPct, (nextWidth) => {
    onInstancePatch({ kind: 'custom-image', imageMaxWidthPct: nextWidth });
  });

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onInstancePatch({ kind: 'custom-image', imageBase64: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Paveikslėlis</p>

      {instance.imageBase64 ? (
        <div className="flex flex-col gap-2 mb-3">
          <img
            src={instance.imageBase64}
            alt=""
            className="h-20 w-full object-contain rounded border border-slate-200 bg-slate-50"
          />
          <button
            type="button"
            className="text-[11px] font-medium text-red-600 hover:text-red-700"
            onClick={() => onInstancePatch({ kind: 'custom-image', imageBase64: undefined })}
          >
            Pašalinti paveikslėlį
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-slate-400 rounded-md p-3 bg-slate-50 cursor-pointer text-center mb-3">
          <span className="text-xs font-medium text-slate-600">Įkelti paveikslėlį</span>
          <span className="text-[10px] text-slate-400 mt-0.5">PNG / JPG</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      )}

      <label className="text-xs font-medium text-slate-600 mb-1 block">
        Plotis: {imageWidthDraft.value}%
      </label>
      <input
        type="range"
        min={10}
        max={100}
        value={imageWidthDraft.value}
        onFocus={imageWidthDraft.beginEditing}
        onChange={(event) => imageWidthDraft.setValue(Number(event.target.value))}
        onMouseUp={imageWidthDraft.commit}
        onTouchEnd={imageWidthDraft.commit}
        onBlur={imageWidthDraft.commit}
        className="w-full mb-3"
      />
    </div>
  );
}
