import { blockLabel, isSingletonDataKind } from '@/lib/invoice-template/blocks';
import {
  parseCanvasColumnDropId,
  parseCanvasInstanceDragId,
  parseCanvasRowSortableId,
  parseLibraryBlockDragId,
  parseLibraryRowDragId,
} from '@/lib/invoice-template/dnd';
import {
  createBlockInstance,
  createTemplateRow,
  findDataBlockInstance,
  insertInstance,
  moveBlockInstanceToColumn,
  reorderTemplateRows,
  type BlockKind,
  type InvoiceTemplateLayoutDto,
} from '@/lib/invoice-template/layout';

export interface DropTargetColumn {
  rowId: string;
  columnId: string;
}

export function resolveDropTargetColumn(layout: InvoiceTemplateLayoutDto, overId: string): DropTargetColumn | null {
  if (overId === 'canvas:root') {
    const firstRow = layout.layout[0];
    const firstColumn = firstRow?.columns[0];
    if (!firstRow || !firstColumn) return null;
    return { rowId: firstRow.id, columnId: firstColumn.id };
  }

  const directColumn = parseCanvasColumnDropId(overId);
  if (directColumn) return directColumn;

  const overInstanceId = parseCanvasInstanceDragId(overId);
  if (overInstanceId) {
    for (const row of layout.layout) {
      for (const column of row.columns) {
        if (column.content.some((existing) => existing.id === overInstanceId)) {
          return { rowId: row.id, columnId: column.id };
        }
      }
    }
  }

  const overRowId = parseCanvasRowSortableId(overId);
  if (!overRowId) return null;

  const row = layout.layout.find((candidate) => candidate.id === overRowId);
  const firstColumn = row?.columns[0];
  if (!firstColumn) return null;
  return { rowId: overRowId, columnId: firstColumn.id };
}

export function resolveDropTargetRow(layout: InvoiceTemplateLayoutDto, overId: string): string | null {
  if (overId === 'canvas:root') {
    const rows = layout.layout;
    const lastRow = rows[rows.length - 1];
    return lastRow?.id ?? null;
  }

  const directRowId = parseCanvasRowSortableId(overId);
  if (directRowId) return directRowId;

  const overColumn = parseCanvasColumnDropId(overId);
  if (overColumn) return overColumn.rowId;

  const overInstanceId = parseCanvasInstanceDragId(overId);
  if (!overInstanceId) return null;

  const rowWithInstance = layout.layout.find((row) =>
    row.columns.some((column) => column.content.some((item) => item.id === overInstanceId)),
  );

  return rowWithInstance?.id ?? null;
}

export function resolveDragLabel(activeId: string): string | null {
  const rowColumns = parseLibraryRowDragId(activeId);
  if (rowColumns !== null) return `Eilutė (${rowColumns} st.)`;

  const libraryBlock = parseLibraryBlockDragId(activeId);
  if (libraryBlock) return blockLabel(libraryBlock);

  if (parseCanvasInstanceDragId(activeId)) return 'Blokas';

  if (parseCanvasRowSortableId(activeId)) return 'Eilutė';

  return null;
}

interface ResolveNextLayoutInput {
  layout: InvoiceTemplateLayoutDto;
  activeId: string;
  overId: string;
}

export function resolveNextLayoutFromDragEnd({ layout, activeId, overId }: ResolveNextLayoutInput): InvoiceTemplateLayoutDto | null {
  const activeRowId = parseCanvasRowSortableId(activeId);
  const overRowId = resolveDropTargetRow(layout, overId);
  if (activeRowId && overRowId && activeRowId !== overRowId) {
    return reorderTemplateRows(layout, activeRowId, overRowId);
  }

  const libraryRowColumns = parseLibraryRowDragId(activeId);
  if (libraryRowColumns !== null) {
    const nextRow = createTemplateRow(libraryRowColumns);
    const nextRows = [...layout.layout];

    if (overRowId) {
      const insertIndex = nextRows.findIndex((row) => row.id === overRowId);
      if (insertIndex >= 0) {
        nextRows.splice(insertIndex, 0, nextRow);
      } else {
        nextRows.push(nextRow);
      }
    } else {
      nextRows.push(nextRow);
    }

    return { ...layout, layout: nextRows };
  }

  const dropTarget = resolveDropTargetColumn(layout, overId);
  if (!dropTarget) return null;

  const overInstanceId = parseCanvasInstanceDragId(overId);
  const canvasInstanceId = parseCanvasInstanceDragId(activeId);
  if (canvasInstanceId) {
    if (overInstanceId && canvasInstanceId === overInstanceId) return null;
    return moveBlockInstanceToColumn(
      layout,
      canvasInstanceId,
      dropTarget.rowId,
      dropTarget.columnId,
      overInstanceId ?? undefined,
    );
  }

  const libraryKind = parseLibraryBlockDragId(activeId);
  if (!libraryKind) return null;

  return dropLibraryKind(layout, libraryKind, dropTarget, overInstanceId ?? undefined);
}

export function dropLibraryKind(
  layout: InvoiceTemplateLayoutDto,
  kind: BlockKind,
  target: { rowId: string; columnId: string },
  beforeInstanceId?: string,
): InvoiceTemplateLayoutDto {
  if (isSingletonDataKind(kind)) {
    const existing = findDataBlockInstance(layout, kind);
    if (existing) {
      return moveBlockInstanceToColumn(layout, existing.id, target.rowId, target.columnId, beforeInstanceId);
    }
  }
  const instance = createBlockInstance(kind);
  return insertInstance(layout, instance, target.rowId, target.columnId, beforeInstanceId);
}