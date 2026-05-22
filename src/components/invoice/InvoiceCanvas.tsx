import { Children, type ReactNode, useMemo } from 'react';
import {
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Invoice } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import {
  blockLabel,
  INVOICE_TEMPLATE_BLOCKS,
  type InvoiceTemplateBlockDefinition,
} from '@/lib/invoice-template/blocks';
import {
  canvasColumnDropId,
  canvasPlacedBlockDragId,
  canvasRowSortableId,
} from '@/lib/invoice-template/dnd';
import {
  readTemplateBlockSettings,
  type InvoiceTemplateLayoutDto,
  type InvoiceTemplateRowDto,
  type TemplateBlockId,
} from '@/lib/invoice-template/layout';
import { GripVertical } from 'lucide-react';
import { SellerBlock } from './SellerBlock';
import { InvoiceMetaBlock } from './InvoiceMetaBlock';
import { BuyerBlock } from './BuyerBlock';
import { LineItemsTable } from './LineItemsTable';
import { NotesBlock } from './NotesBlock';
import { VatToggle } from './VatToggle';
import { TotalsBox } from './TotalsBox';
import { InvoiceSignatures } from './InvoiceSignatures';
import { LogoBlock } from './LogoBlock';

export interface InvoiceCanvasProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  settings: SettingsDto;
  layout: InvoiceTemplateLayoutDto;
  isPreview?: boolean;
  selectedBlockId?: TemplateBlockId | null;
  selectedRowId?: string | null;
  onSelectBlock?: (blockId: TemplateBlockId | null) => void;
  onSelectRow?: (rowId: string | null) => void;
}

const CANVAS_DROP_ID = 'canvas:root';
const PREVIEW_PAGE_CONTENT_HEIGHT = 1027;
const DEFAULT_ROW_HEIGHT = 96;
const BLOCK_HEIGHT_ESTIMATE = 84;

export function InvoiceCanvas({
  invoice,
  onChange,
  settings,
  layout,
  isPreview = false,
  selectedBlockId = null,
  selectedRowId = null,
  onSelectBlock,
  onSelectRow,
}: InvoiceCanvasProps) {
  const activePreset =
    settings.designPresets.find((p) => p.id === invoice.designPresetId) || settings.designPresets[0];
  const override = invoice.designOverride;
  const effectivePrimary = override?.primaryColor ?? activePreset?.primaryColor;
  const effectiveAccent = override?.accentColor ?? activePreset?.accentColor;
  const effectiveBg = override?.backgroundImageBase64 ?? activePreset?.backgroundImageBase64;

  const rowSortableIds = useMemo(
    () => layout.layout.map((row) => canvasRowSortableId(row.id)),
    [layout.layout],
  );

  const paginatedRows = useMemo(() => {
    if (!isPreview) return [layout.layout];

    const pages: InvoiceTemplateRowDto[][] = [];
    let currentPage: InvoiceTemplateRowDto[] = [];
    let currentHeight = 0;

    for (const row of layout.layout) {
      const maxMargins = row.columns.reduce((maxValue, column) => {
        const margins = column.content.reduce((sum, blockId) => {
          const blockSettings = readTemplateBlockSettings(layout, blockId);
          return sum + blockSettings.marginTop + blockSettings.marginBottom;
        }, 0);
        return Math.max(maxValue, margins);
      }, 0);

      const densestColumnBlocks = row.columns.reduce((maxValue, column) => {
        return Math.max(maxValue, column.content.length);
      }, 0);

      const estimatedContentHeight = Math.max(
        DEFAULT_ROW_HEIGHT,
        densestColumnBlocks * BLOCK_HEIGHT_ESTIMATE,
      );

      const estimatedRowHeight = estimatedContentHeight + maxMargins + 16;

      if (currentPage.length > 0 && currentHeight + estimatedRowHeight > PREVIEW_PAGE_CONTENT_HEIGHT) {
        pages.push(currentPage);
        currentPage = [row];
        currentHeight = estimatedRowHeight;
        continue;
      }

      currentPage.push(row);
      currentHeight += estimatedRowHeight;
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[]];
  }, [isPreview, layout]);

  return (
    <div className="flex flex-col gap-6">
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
                    onSelectBlock?.(null);
                    onSelectRow?.(row.id);
                  }}
                >
                  {row.columns.map((column) => (
                    <DroppableColumn
                      key={column.id}
                      rowId={row.id}
                      columnId={column.id}
                      isPreview={isPreview}
                    >
                      <SortableContext
                        items={column.content.map((blockId) => canvasPlacedBlockDragId(blockId))}
                        strategy={verticalListSortingStrategy}
                      >
                        {column.content.map((blockId) => (
                          <PlacedBlockShell
                            key={blockId}
                            blockId={blockId}
                            isPreview={isPreview}
                            isSelected={selectedBlockId === blockId}
                            onSelect={() => onSelectBlock?.(blockId)}
                          >
                            {renderTemplateBlock(
                              blockId,
                              invoice,
                              onChange,
                              settings,
                              effectivePrimary,
                              effectiveAccent,
                              layout,
                              isPreview,
                            )}
                          </PlacedBlockShell>
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

function SortableRow({
  row,
  isPreview,
  isSelected,
  onSelect,
  children,
}: SortableRowProps) {
  const sortableId = canvasRowSortableId(row.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

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
    gridTemplateColumns: `repeat(${row.columns.length}, minmax(0, 1fr))`,
    zIndex: isDragging ? 20 : undefined,
  };

  const selectedClass = isSelected && !isPreview ? 'ring-2 ring-sky-400 bg-sky-50/20' : '';

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
      onClick={isPreview ? undefined : onSelect}
      role="button"
      tabIndex={isPreview ? -1 : 0}
      onKeyDown={(event) => {
        if (isPreview) return;
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
  isPreview: boolean;
  children: ReactNode;
}

function DroppableColumn({ rowId, columnId, isPreview, children }: DroppableColumnProps) {
  const dropId = canvasColumnDropId(rowId, columnId);
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const isEmpty = Children.count(children) === 0;

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
        outline: isPreview ? 'none' : '1px dashed #cbd5e1',
        outlineOffset: '-1px',
        backgroundColor: isOver ? '#e0f2fe' : undefined,
        boxShadow: isOver ? 'inset 0 0 0 2px #38bdf8' : undefined,
      }}
    >
      {children}
      {isEmpty && !isPreview && (
        <p className="text-[11px] text-slate-400 font-medium">Įtempkite bloką čia</p>
      )}
    </div>
  );
}

interface PlacedBlockShellProps {
  blockId: TemplateBlockId;
  isPreview: boolean;
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function PlacedBlockShell({ blockId, isPreview, isSelected, onSelect, children }: PlacedBlockShellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvasPlacedBlockDragId(blockId),
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
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {!isPreview && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{blockLabel(blockId)}</p>
          <button
            type="button"
            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 cursor-grab active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            Perkelti
          </button>
        </div>
      )}
      {children}
    </article>
  );
}

function renderTemplateBlock(
  blockId: TemplateBlockId,
  invoice: Invoice,
  onChange: (updatedInvoice: Invoice) => void,
  settings: SettingsDto,
  effectivePrimary: string | undefined,
  effectiveAccent: string | undefined,
  layout: InvoiceTemplateLayoutDto,
  isPreview: boolean,
): React.ReactNode {
  const blockSettings = readTemplateBlockSettings(layout, blockId);
  const alignClass =
    blockSettings.align === 'center'
      ? 'items-center text-center'
      : blockSettings.align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';

  const shellClass = isPreview ? 'rounded-none p-0 bg-transparent' : 'rounded-md p-2';

  const content = (() => {
    if (blockId === 'logo') {
      return <LogoBlock settings={settings} />;
    }
  if (blockId === 'seller-info') {
      return <SellerBlock settings={settings} />;
  }
  if (blockId === 'invoice-meta') {
      return (
        <InvoiceMetaBlock
          invoice={invoice}
          onChange={onChange}
          hasVat={invoice.vat.enabled}
          primaryColor={effectivePrimary}
          isPreview={isPreview}
        />
      );
  }
  if (blockId === 'buyer-info') {
      return <BuyerBlock invoice={invoice} onChange={onChange} isPreview={isPreview} />;
  }
  if (blockId === 'line-items') {
      return <LineItemsTable invoice={invoice} onChange={onChange} isPreview={isPreview} />;
  }
  if (blockId === 'notes') {
      return <NotesBlock invoice={invoice} onChange={onChange} isPreview={isPreview} />;
  }
  if (blockId === 'totals') {
      const totalsAlignClass =
        blockSettings.align === 'center'
          ? 'items-center'
          : blockSettings.align === 'left'
            ? 'items-start'
            : 'items-end';

      return (
        <div className={`flex w-full min-w-0 flex-col gap-3 ${totalsAlignClass}`}>
          <VatToggle invoice={invoice} onChange={onChange} isPreview={isPreview} />
          <TotalsBox invoice={invoice} accentColor={effectiveAccent} />
        </div>
      );
    }
    if (blockId === 'signature') {
      return <InvoiceSignatures />;
    }
    const fallback: InvoiceTemplateBlockDefinition | undefined = INVOICE_TEMPLATE_BLOCKS.find(
      (item) => item.id === blockId,
    );
    return <p className="text-xs text-slate-500">{fallback?.label ?? blockId}</p>;
  })();

  return (
    <div
      className={`flex w-full flex-col ${alignClass} ${shellClass}`}
      style={{
        paddingTop: `${blockSettings.marginTop}px`,
        paddingBottom: `${blockSettings.marginBottom}px`,
      }}
    >
      {content}
    </div>
  );
}
