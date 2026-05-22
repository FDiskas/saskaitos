import type { TemplateBlockId } from './layout';

const LIBRARY_ROW_PREFIX = 'library:row:';
const LIBRARY_BLOCK_PREFIX = 'library:block:';
const CANVAS_ROW_PREFIX = 'canvas:row:';
const CANVAS_COLUMN_PREFIX = 'canvas:column:';
const CANVAS_BLOCK_PREFIX = 'canvas:block:';

export function libraryRowDragId(columnCount: number): string {
  return `${LIBRARY_ROW_PREFIX}${columnCount}`;
}

export function libraryBlockDragId(blockId: TemplateBlockId): string {
  return `${LIBRARY_BLOCK_PREFIX}${blockId}`;
}

export function canvasRowSortableId(rowId: string): string {
  return `${CANVAS_ROW_PREFIX}${rowId}`;
}

export function canvasColumnDropId(rowId: string, columnId: string): string {
  return `${CANVAS_COLUMN_PREFIX}${rowId}:${columnId}`;
}

export function canvasPlacedBlockDragId(blockId: TemplateBlockId): string {
  return `${CANVAS_BLOCK_PREFIX}${blockId}`;
}

export function parseLibraryRowDragId(id: string): number | null {
  if (!id.startsWith(LIBRARY_ROW_PREFIX)) return null;
  const value = Number(id.slice(LIBRARY_ROW_PREFIX.length));
  if (!Number.isInteger(value)) return null;
  if (value < 1 || value > 4) return null;
  return value;
}

export function parseLibraryBlockDragId(id: string): TemplateBlockId | null {
  if (!id.startsWith(LIBRARY_BLOCK_PREFIX)) return null;
  const blockId = id.slice(LIBRARY_BLOCK_PREFIX.length);
  if (
    blockId === 'logo' ||
    blockId === 'seller-info' ||
    blockId === 'buyer-info' ||
    blockId === 'invoice-meta' ||
    blockId === 'line-items' ||
    blockId === 'totals' ||
    blockId === 'notes' ||
    blockId === 'signature'
  ) {
    return blockId;
  }
  return null;
}

export function parseCanvasRowSortableId(id: string): string | null {
  if (!id.startsWith(CANVAS_ROW_PREFIX)) return null;
  return id.slice(CANVAS_ROW_PREFIX.length);
}

export function parseCanvasColumnDropId(
  id: string,
): { rowId: string; columnId: string } | null {
  if (!id.startsWith(CANVAS_COLUMN_PREFIX)) return null;
  const raw = id.slice(CANVAS_COLUMN_PREFIX.length);
  const [rowId, columnId] = raw.split(':');
  if (!rowId || !columnId) return null;
  return { rowId, columnId };
}

export function parseCanvasPlacedBlockDragId(id: string): TemplateBlockId | null {
  if (!id.startsWith(CANVAS_BLOCK_PREFIX)) return null;
  const blockId = id.slice(CANVAS_BLOCK_PREFIX.length);
  return parseLibraryBlockDragId(`${LIBRARY_BLOCK_PREFIX}${blockId}`);
}
