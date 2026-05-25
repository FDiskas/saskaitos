import { type ChangeEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Invoice } from '@/lib/domain';
import type { DesignPresetDto, SettingsDto } from '@/lib/drive/settings';
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_HEADING_COLOR,
  DEFAULT_MUTED_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_TEXT_COLOR,
} from '@/lib/drive/settings';
import type { InvoiceTemplateLayoutDto } from '@/lib/invoice-template/layout';
import {
  DATA_BLOCK_DEFINITIONS,
  DECOR_BLOCK_DEFINITIONS,
  ROW_LIBRARY_COLUMNS,
} from '@/lib/invoice-template/blocks';
import { libraryBlockDragId, libraryRowDragId } from '@/lib/invoice-template/dnd';
import type { BlockKind } from '@/lib/invoice-template/layout';
import { LayoutPanelTop, Paintbrush, Image as ImageIcon, Upload, RotateCcw } from 'lucide-react';
import type { DesignOverride } from '@/lib/domain/Invoice';
import { useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';

export interface DesignSidebarProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  settings: SettingsDto;
  layout: InvoiceTemplateLayoutDto;
}

interface ColorRowConfig {
  field: keyof Omit<DesignOverride, 'backgroundImageBase64'>;
  presetKey: keyof Pick<
    DesignPresetDto,
    'primaryColor' | 'accentColor' | 'textColor' | 'mutedColor' | 'borderColor' | 'headingColor'
  >;
  defaultValue: string;
  labelKey: 'design.sidebar.color.primary'
    | 'design.sidebar.color.accent'
    | 'design.sidebar.color.text'
    | 'design.sidebar.color.muted'
    | 'design.sidebar.color.border'
    | 'design.sidebar.color.heading';
}

const COLOR_ROWS: readonly ColorRowConfig[] = [
  { field: 'primaryColor', presetKey: 'primaryColor', defaultValue: DEFAULT_PRIMARY_COLOR, labelKey: 'design.sidebar.color.primary' },
  { field: 'accentColor', presetKey: 'accentColor', defaultValue: DEFAULT_ACCENT_COLOR, labelKey: 'design.sidebar.color.accent' },
  { field: 'textColor', presetKey: 'textColor', defaultValue: DEFAULT_TEXT_COLOR, labelKey: 'design.sidebar.color.text' },
  { field: 'mutedColor', presetKey: 'mutedColor', defaultValue: DEFAULT_MUTED_COLOR, labelKey: 'design.sidebar.color.muted' },
  { field: 'borderColor', presetKey: 'borderColor', defaultValue: DEFAULT_BORDER_COLOR, labelKey: 'design.sidebar.color.border' },
  { field: 'headingColor', presetKey: 'headingColor', defaultValue: DEFAULT_HEADING_COLOR, labelKey: 'design.sidebar.color.heading' },
];

export function DesignSidebar({ invoice, onChange, settings }: DesignSidebarProps) {
  const t = useTranslate();
  const presets = settings.designPresets || [];
  const activePreset = presets.find((preset) => preset.id === invoice.designPresetId) || presets[0];
  const override = invoice.designOverride;
  const effectiveBg = override?.backgroundImageBase64 ?? activePreset?.backgroundImageBase64;
  const hasOverride = override !== undefined && Object.values(override).some((value) => value !== undefined);

  const handleSelectPreset = (presetId: string) => {
    onChange(invoice.withDesignPreset(presetId));
  };

  const handleResetOverride = () => {
    onChange(
      invoice.withDesignOverride({
        primaryColor: undefined,
        accentColor: undefined,
        textColor: undefined,
        mutedColor: undefined,
        borderColor: undefined,
        headingColor: undefined,
        backgroundImageBase64: undefined,
      }),
    );
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange(invoice.withDesignOverride({ backgroundImageBase64: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-70 shrink-0 border-l border-slate-200 bg-white p-4 h-full flex flex-col gap-6 no-print overflow-y-auto">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Paintbrush className="h-3.5 w-3.5" />
          {t['design.sidebar.template']}
        </h3>
        <select
          value={invoice.designPresetId}
          onChange={(event) => handleSelectPreset(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {activePreset && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {t['design.sidebar.invoiceStyle']}
            </h4>
            {hasOverride && (
              <button
                type="button"
                onClick={handleResetOverride}
                className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                title={t['design.sidebar.resetToPreset']}
              >
                <RotateCcw className="h-3 w-3" />
                {t['design.sidebar.reset']}
              </button>
            )}
          </div>

          {COLOR_ROWS.map((row) => (
            <ColorPickerRow
              key={row.field}
              label={t[row.labelKey] as string}
              value={override?.[row.field] ?? activePreset[row.presetKey] ?? row.defaultValue}
              onChange={(value) => onChange(invoice.withDesignOverride({ [row.field]: value }))}
            />
          ))}

          <hr className="border-slate-100 my-2" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
              {t['design.sidebar.background']}
            </label>
            {effectiveBg ? (
              <div className="relative rounded-md border border-slate-200 p-2 bg-slate-50 flex flex-col gap-2">
                <img
                  src={effectiveBg}
                  alt={t['design.sidebar.backgroundAlt']}
                  className="h-20 w-full object-cover rounded border border-slate-150"
                />
                <button
                  type="button"
                  onClick={() => onChange(invoice.withDesignOverride({ backgroundImageBase64: undefined }))}
                  className="w-full text-center py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-white rounded border border-red-200 hover:bg-red-50 cursor-pointer"
                >
                  {t['design.sidebar.backgroundRemove']}
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-slate-400 rounded-md p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-center group">
                <Upload className="h-5 w-5 text-slate-400 group-hover:text-slate-600 mb-1.5" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
                  {t['design.sidebar.backgroundUpload']}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PNG / JPG</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <LayoutPanelTop className="h-3.5 w-3.5" />
          {t['design.sidebar.blockLibrary']}
        </h3>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t['design.sidebar.rows']}</p>
          <div className="grid grid-cols-2 gap-2">
            {ROW_LIBRARY_COLUMNS.map((columns) => (
              <LibraryDraggableCard
                key={columns}
                dragId={libraryRowDragId(columns)}
                label={withParams(t['design.sidebar.rowLibraryLabel'], { columns })}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t['design.sidebar.dataBlocks']}</p>
          <div className="grid grid-cols-1 gap-2">
            {DATA_BLOCK_DEFINITIONS.map((block) => (
              <LibraryDraggableCard
                key={block.kind}
                dragId={libraryBlockDragId(block.kind)}
                label={t[block.labelKey] as string}
                blockKind={block.kind}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t['design.sidebar.decorBlocks']}</p>
          <div className="grid grid-cols-1 gap-2">
            {DECOR_BLOCK_DEFINITIONS.map((block) => (
              <LibraryDraggableCard
                key={block.kind}
                dragId={libraryBlockDragId(block.kind)}
                label={t[block.labelKey] as string}
                blockKind={block.kind}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPickerRow({ label, value, onChange }: ColorPickerRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
        />
        <span className="text-xs font-mono uppercase text-slate-500">{value}</span>
      </div>
    </div>
  );
}

interface LibraryDraggableCardProps {
  dragId: string;
  label: string;
  blockKind?: BlockKind;
}

function LibraryDraggableCard({ dragId, label, blockKind }: LibraryDraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { source: 'library', blockKind },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : 'transform 120ms ease-out, box-shadow 120ms ease-out',
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-grab active:cursor-grabbing shadow-xs ${isDragging ? 'shadow-lg opacity-95' : ''}`}
      data-dragging={isDragging}
      {...listeners}
      {...attributes}
    >
      {label}
    </button>
  );
}
