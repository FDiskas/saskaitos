import { type ReactNode, useMemo } from 'react';
import { useGoogleFontInBrowser } from '@/hooks';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Palette, resolvePalette } from '@/lib/design';
import { type Invoice } from '@/lib/domain';
import { type SettingsDto } from '@/lib/drive/settings';
import { blockLabel } from '@/lib/invoice-template/blocks';
import {
  canvasColumnDropId,
  canvasInstanceDragId,
  canvasRowSortableId,
} from '@/lib/invoice-template/dnd';
import {
  rowTotalSpan,
  type BlockInstance,
  type InvoiceTemplateLayoutDto,
  type InvoiceTemplateRowDto,
} from '@/lib/invoice-template/layout';
import { GripVertical } from 'lucide-react';
import { useTranslate } from '@/hooks';
import { paginateCanvasRows } from './canvasPagination';
import { renderBlockInstanceContent } from './instanceContentRenderers';

export interface InvoiceCanvasProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  settings: SettingsDto;
  layout: InvoiceTemplateLayoutDto;
  isPreview?: boolean;
  selectedInstanceId?: string | null;
  selectedRowId?: string | null;
  onSelectInstance?: (instanceId: string | null) => void;
  onSelectRow?: (rowId: string | null) => void;
  onInstancePatch?: (instanceId: string, patch: Partial<BlockInstance>) => void;
}

const CANVAS_DROP_ID = 'canvas:root';

export function InvoiceCanvas({
  invoice,
  onChange,
  settings,
  layout,
  isPreview = false,
  selectedInstanceId = null,
  selectedRowId = null,
  onSelectInstance,
  onSelectRow,
  onInstancePatch,
}: InvoiceCanvasProps) {
  const activePreset =
    settings.designPresets.find((p) => p.id === invoice.designPresetId) || settings.designPresets[0];
  const override = invoice.designOverride;
  const palette = resolvePalette(activePreset, override);
  const effectiveBg = override?.backgroundImageBase64 ?? activePreset?.backgroundImageBase64;
  useGoogleFontInBrowser(activePreset?.fontFamily);

  const rowSortableIds = useMemo(
    () => layout.layout.map((row) => canvasRowSortableId(row.id)),
    [layout.layout],
  );

  const paginatedRows = useMemo(() => {
    if (!isPreview) return [layout.layout];
    return paginateCanvasRows(layout.layout);
  }, [isPreview, layout]);

  return (
    <div className="flex flex-col gap-6" style={{ color: palette.textColor }}>
      {paginatedRows.map((rows, pageIndex) => (
        <CanvasDropZone key={`page-${pageIndex}`}>
          {(isCanvasOver) => (
            <div
              id="invoice-page-canvas"
              className="relative aspect-[1/1.414] w-198.5 min-h-280.75 bg-white shadow-xl border border-slate-100 p-12 flex flex-col gap-4 select-text print:shadow-none print:border-none print:p-0 print:w-full print:aspect-auto"
              style={{
                fontFamily: activePreset?.fontFamily || 'Inter',
                backgroundImage: effectiveBg ? `url(${effectiveBg})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: palette.textColor,
              }}
              data-over={!isPreview && isCanvasOver}
            >
              <SortableContext items={rowSortableIds} strategy={verticalListSortingStrategy}>
                {rows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    isPreview={isPreview}
                    isSelected={selectedRowId === row.id}
                    onSelect={() => {
                      onSelectInstance?.(null);
                      onSelectRow?.(row.id);
                    }}
                  >
                    {row.columns.map((column) => (
                      <DroppableColumn
                        key={column.id}
                        rowId={row.id}
                        columnId={column.id}
                        span={column.span}
                        isPreview={isPreview}
                        isEmpty={column.content.length === 0}
                      >
                        <SortableContext
                          items={column.content.map((instance) => canvasInstanceDragId(instance.id))}
                          strategy={verticalListSortingStrategy}
                        >
                          {column.content.map((instance) => (
                            <PlacedInstanceShell
                              key={instance.id}
                              instance={instance}
                              isPreview={isPreview}
                              isSelected={selectedInstanceId === instance.id}
                              onSelect={() => onSelectInstance?.(instance.id)}
                            >
                              {renderInstance(instance, invoice, onChange, settings, palette, isPreview, onInstancePatch)}
                            </PlacedInstanceShell>
                          ))}
                        </SortableContext>
                      </DroppableColumn>
                    ))}
                  </SortableRow>
                ))}
              </SortableContext>
            </div>
          )}
        </CanvasDropZone>
      ))}
    </div>
  );
}

interface CanvasDropZoneProps {
  children: (isOver: boolean) => ReactNode;
}

function CanvasDropZone({ children }: CanvasDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ID });
  return <div ref={setNodeRef}>{children(isOver)}</div>;
}

interface SortableRowProps {
  row: InvoiceTemplateRowDto;
  isPreview: boolean;
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function SortableRow({ row, isPreview, isSelected, onSelect, children }: SortableRowProps) {
  const sortableId = canvasRowSortableId(row.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });

  const totalSpan = rowTotalSpan(row);
  const style = {
    transform: CSS.Transform.toString(
      transform
        ? {
            ...transform,
            x: 0,
          }
        : null,
    ),
    transition: isDragging ? undefined : transition,
    gridTemplateColumns: `repeat(${totalSpan}, minmax(0, 1fr))`,
    zIndex: isDragging ? 20 : undefined,
  };

  const selectedClass = isSelected && !isPreview ? 'ring-2 ring-sky-400 bg-sky-50/20' : '';

  const shouldIgnoreRowSelection = (target: EventTarget | null, currentTarget: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const interactiveElement = target.closest('button, input, textarea, select, a, [role="button"]');
    if (!interactiveElement) return false;
    return interactiveElement !== currentTarget;
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={
        isPreview
          ? 'relative grid items-stretch gap-3 rounded-none border-none bg-transparent p-0'
          : `relative grid items-stretch gap-3 rounded-lg border border-slate-200 bg-white/85 ${selectedClass} ${isDragging ? 'shadow-lg' : ''}`
      }
      data-dragging={isDragging}
      onClick={
        isPreview
          ? undefined
          : (event) => {
              if (shouldIgnoreRowSelection(event.target, event.currentTarget)) return;
              onSelect();
            }
      }
      role="button"
      tabIndex={isPreview ? -1 : 0}
      onKeyDown={(event) => {
        if (isPreview) return;
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {!isPreview && (
        <div className="absolute -left-9 top-2 flex items-start gap-1">
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900 cursor-grab active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {children}
    </section>
  );
}

interface DroppableColumnProps {
  rowId: string;
  columnId: string;
  span: number;
  isPreview: boolean;
  isEmpty: boolean;
  children: ReactNode;
}

function DroppableColumn({ rowId, columnId, span, isPreview, isEmpty, children }: DroppableColumnProps) {
  const t = useTranslate();
  const dropId = canvasColumnDropId(rowId, columnId);
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  return (
    <div
      ref={setNodeRef}
      className={
        isPreview
          ? 'flex h-full min-h-0 flex-col rounded-none bg-transparent p-0'
          : 'flex h-full min-h-11 flex-col rounded-md bg-white/75 p-2'
      }
      data-over={isOver}
      style={{
        gridColumn: `span ${span} / span ${span}`,
        outline: isPreview ? 'none' : '1px dashed #cbd5e1',
        outlineOffset: '-1px',
        backgroundColor: isOver ? '#e0f2fe' : undefined,
        boxShadow: isOver ? 'inset 0 0 0 2px #38bdf8' : undefined,
      }}
    >
      {children}
      {isEmpty && !isPreview && (
        <p className="text-[11px] text-slate-400 font-medium">{t['invoice.canvas.dropHere']}</p>
      )}
    </div>
  );
}

interface PlacedInstanceShellProps {
  instance: BlockInstance;
  isPreview: boolean;
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function PlacedInstanceShell({ instance, isPreview, isSelected, onSelect, children }: PlacedInstanceShellProps) {
  const t = useTranslate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvasInstanceDragId(instance.id),
    disabled: isPreview,
  });

  const selectedClass = isSelected ? 'ring-2 ring-sky-400 bg-sky-50/40' : '';

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        zIndex: isDragging ? 30 : undefined,
      }}
      className={
        isPreview
          ? 'relative mb-2 w-full rounded-md bg-transparent p-0'
          : `relative mb-2 w-full rounded-md border border-slate-100 bg-white p-2 shadow-xs ${selectedClass} ${isDragging ? 'shadow-lg opacity-95' : ''}`
      }
      data-dragging={isDragging}
      onClick={
        isPreview
          ? undefined
          : (event) => {
              event.stopPropagation();
              onSelect();
            }
      }
      role="button"
      tabIndex={isPreview ? -1 : 0}
      onKeyDown={(event) => {
        if (isPreview) return;
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {!isPreview && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{blockLabel(instance.kind, t)}</p>
          <button
            type="button"
            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 cursor-grab active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            {t['invoice.canvas.move']}
          </button>
        </div>
      )}
      {children}
    </article>
  );
}

function renderInstance(
  instance: BlockInstance,
  invoice: Invoice,
  onChange: (updatedInvoice: Invoice) => void,
  settings: SettingsDto,
  palette: Palette,
  isPreview: boolean,
  onInstancePatch: ((instanceId: string, patch: Partial<BlockInstance>) => void) | undefined,
): React.ReactNode {
  const alignClass =
    instance.align === 'center'
      ? 'items-center text-center'
      : instance.align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';

  const shellClass = isPreview ? 'rounded-none p-0 bg-transparent' : 'rounded-md p-2';

  return (
    <div
      className={`flex w-full flex-col ${alignClass} ${shellClass}`}
      style={{
        paddingTop: `${instance.marginTop}px`,
        paddingBottom: `${instance.marginBottom}px`,
      }}
    >
      {renderBlockInstanceContent(instance, {
        invoice,
        onChange,
        settings,
        palette,
        isPreview,
        onInstancePatch,
      })}
    </div>
  );
}
