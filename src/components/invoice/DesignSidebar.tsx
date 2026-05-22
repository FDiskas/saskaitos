import { type ChangeEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Invoice } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import type { InvoiceTemplateLayoutDto, TemplateBlockId } from '@/lib/invoice-template/layout';
import { INVOICE_TEMPLATE_BLOCKS, ROW_LIBRARY_COLUMNS } from '@/lib/invoice-template/blocks';
import { libraryBlockDragId, libraryRowDragId } from '@/lib/invoice-template/dnd';
import { LayoutPanelTop, Paintbrush, Image as ImageIcon, Upload, RotateCcw } from 'lucide-react';

export interface DesignSidebarProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  settings: SettingsDto;
  layout: InvoiceTemplateLayoutDto;
}

export function DesignSidebar({ invoice, onChange, settings }: DesignSidebarProps) {
  const presets = settings.designPresets || [];
  const activePreset = presets.find((p) => p.id === invoice.designPresetId) || presets[0];
  const override = invoice.designOverride;

  const effectivePrimary = override?.primaryColor ?? activePreset?.primaryColor ?? '#0f172a';
  const effectiveAccent = override?.accentColor ?? activePreset?.accentColor ?? '#2563eb';
  const effectiveBg = override?.backgroundImageBase64 ?? activePreset?.backgroundImageBase64;

  const handleSelectPreset = (presetId: string) => {
    onChange(invoice.withDesignPreset(presetId));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange(invoice.withDesignOverride({ backgroundImageBase64: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const hasOverride = override !== undefined;

  return (
    <aside className="w-70 shrink-0 border-l border-slate-200 bg-white p-4 h-full flex flex-col gap-6 no-print overflow-y-auto">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Paintbrush className="h-3.5 w-3.5" />
          Dizaino šablonas
        </h3>
        <select
          value={invoice.designPresetId}
          onChange={(e) => handleSelectPreset(e.target.value)}
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
              Šios sąskaitos stilius
            </h4>
            {hasOverride && (
              <button
                type="button"
                onClick={() =>
                  onChange(
                    invoice.withDesignOverride({
                      primaryColor: undefined,
                      accentColor: undefined,
                      backgroundImageBase64: undefined,
                    }),
                  )
                }
                className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Atstatyti į šabloną"
              >
                <RotateCcw className="h-3 w-3" />
                Atstatyti
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium">Pagrindinė spalva</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={effectivePrimary}
                onChange={(e) => onChange(invoice.withDesignOverride({ primaryColor: e.target.value }))}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <span className="text-xs font-mono uppercase text-slate-500">{effectivePrimary}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium">Akcento spalva</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={effectiveAccent}
                onChange={(e) => onChange(invoice.withDesignOverride({ accentColor: e.target.value }))}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <span className="text-xs font-mono uppercase text-slate-500">{effectiveAccent}</span>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
              Foninis paveikslėlis
            </label>
            {effectiveBg ? (
              <div className="relative rounded-md border border-slate-200 p-2 bg-slate-50 flex flex-col gap-2">
                <img
                  src={effectiveBg}
                  alt="Foninis"
                  className="h-20 w-full object-cover rounded border border-slate-150"
                />
                <button
                  type="button"
                  onClick={() => onChange(invoice.withDesignOverride({ backgroundImageBase64: undefined }))}
                  className="w-full text-center py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-white rounded border border-red-200 hover:bg-red-50 cursor-pointer"
                >
                  Pašalinti foną
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-slate-400 rounded-md p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-center group">
                <Upload className="h-5 w-5 text-slate-400 group-hover:text-slate-600 mb-1.5" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
                  Įkelti foną
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
          Blokų biblioteka
        </h3>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Eilutės</p>
          <div className="grid grid-cols-2 gap-2">
            {ROW_LIBRARY_COLUMNS.map((columns) => (
              <LibraryDraggableCard
                key={columns}
                dragId={libraryRowDragId(columns)}
                label={`Eilutė (${columns} st.)`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Duomenų blokai</p>
          <div className="grid grid-cols-1 gap-2">
            {INVOICE_TEMPLATE_BLOCKS.map((block) => (
              <LibraryDraggableCard
                key={block.id}
                dragId={libraryBlockDragId(block.id)}
                label={block.label}
                blockId={block.id}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

interface LibraryDraggableCardProps {
  dragId: string;
  label: string;
  blockId?: TemplateBlockId;
}

function LibraryDraggableCard({ dragId, label, blockId }: LibraryDraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { source: 'library', blockId },
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
