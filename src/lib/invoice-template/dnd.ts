import { BlockKindSchema, type BlockKind } from './layout';

const LIBRARY_ROW_PREFIX = 'library:row:';
const LIBRARY_BLOCK_PREFIX = 'library:block:';
const CANVAS_ROW_PREFIX = 'canvas:row:';
const CANVAS_COLUMN_PREFIX = 'canvas:column:';
const CANVAS_INSTANCE_PREFIX = 'canvas:instance:';

export function libraryRowDragId(columnCount: number): string {
  return `${LIBRARY_ROW_PREFIX}${columnCount}`;
}

export function libraryBlockDragId(kind: BlockKind): string {
  return `${LIBRARY_BLOCK_PREFIX}${kind}`;
}

export function canvasRowSortableId(rowId: string): string {
  return `${CANVAS_ROW_PREFIX}${rowId}`;
}

export function canvasColumnDropId(rowId: string, columnId: string): string {
  return `${CANVAS_COLUMN_PREFIX}${rowId}:${columnId}`;
}

export function canvasInstanceDragId(instanceId: string): string {
  return `${CANVAS_INSTANCE_PREFIX}${instanceId}`;
}

export function parseLibraryRowDragId(id: string): number | null {
  if (!id.startsWith(LIBRARY_ROW_PREFIX)) return null;
  const value = Number(id.slice(LIBRARY_ROW_PREFIX.length));
  if (!Number.isInteger(value)) return null;
  if (value < 1 || value > 4) return null;
  return value;
}

export function parseLibraryBlockDragId(id: string): BlockKind | null {
  if (!id.startsWith(LIBRARY_BLOCK_PREFIX)) return null;
  const raw = id.slice(LIBRARY_BLOCK_PREFIX.length);
  const result = BlockKindSchema.safeParse(raw);
  return result.success ? result.data : null;
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

export function parseCanvasInstanceDragId(id: string): string | null {
  if (!id.startsWith(CANVAS_INSTANCE_PREFIX)) return null;
  return id.slice(CANVAS_INSTANCE_PREFIX.length);
}
