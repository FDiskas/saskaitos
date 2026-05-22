import { describe, expect, it } from 'vitest';
import {
  canvasColumnDropId,
  canvasInstanceDragId,
  canvasRowSortableId,
  libraryBlockDragId,
  libraryRowDragId,
} from '@/lib/invoice-template/dnd';
import type { InvoiceTemplateLayoutDto } from '@/lib/invoice-template/layout';
import {
  resolveDragLabel,
  resolveDropTargetColumn,
  resolveDropTargetRow,
  resolveNextLayoutFromDragEnd,
} from './invoice-editor-dnd';

function baseLayout(): InvoiceTemplateLayoutDto {
  return {
    layout: [
      {
        id: 'row-1',
        type: 'row',
        columns: [
          {
            id: 'col-1-1',
            span: 1,
            content: [{ id: 'inst-seller', kind: 'seller-info', align: 'left', marginTop: 0, marginBottom: 0 }],
          },
          {
            id: 'col-1-2',
            span: 1,
            content: [{ id: 'inst-meta', kind: 'invoice-meta', align: 'left', marginTop: 0, marginBottom: 0 }],
          },
        ],
      },
      {
        id: 'row-2',
        type: 'row',
        columns: [
          {
            id: 'col-2-1',
            span: 1,
            content: [{ id: 'inst-buyer', kind: 'buyer-info', align: 'left', marginTop: 0, marginBottom: 0 }],
          },
        ],
      },
    ],
  };
}

describe('invoice editor DnD helpers', () => {
  it('when dropping on canvas root, then resolves first row and column', () => {
    const resolved = resolveDropTargetColumn(baseLayout(), 'canvas:root');

    expect(resolved).toEqual({ rowId: 'row-1', columnId: 'col-1-1' });
  });

  it('when hovering instance, then resolves containing row and column', () => {
    const resolved = resolveDropTargetColumn(baseLayout(), canvasInstanceDragId('inst-buyer'));

    expect(resolved).toEqual({ rowId: 'row-2', columnId: 'col-2-1' });
  });

  it('when hovering column, then resolves row target', () => {
    const resolved = resolveDropTargetRow(baseLayout(), canvasColumnDropId('row-2', 'col-2-1'));

    expect(resolved).toBe('row-2');
  });

  it('when dragging canvas row over another row, then returns reordered layout', () => {
    const nextLayout = resolveNextLayoutFromDragEnd({
      layout: baseLayout(),
      activeId: canvasRowSortableId('row-2'),
      overId: canvasRowSortableId('row-1'),
    });

    expect(nextLayout?.layout[0]?.id).toBe('row-2');
    expect(nextLayout?.layout[1]?.id).toBe('row-1');
  });

  it('when dropping singleton block kind, then existing block is moved not duplicated', () => {
    const nextLayout = resolveNextLayoutFromDragEnd({
      layout: baseLayout(),
      activeId: libraryBlockDragId('seller-info'),
      overId: canvasColumnDropId('row-2', 'col-2-1'),
    });

    const rowOneHasSeller = nextLayout?.layout[0]?.columns[0]?.content.some((item) => item.id === 'inst-seller');
    const rowTwoHasSeller = nextLayout?.layout[1]?.columns[0]?.content.some((item) => item.kind === 'seller-info');

    expect(rowOneHasSeller).toBe(false);
    expect(rowTwoHasSeller).toBe(true);
  });

  it('when dropping library row over row, then inserts new row before hovered row', () => {
    const nextLayout = resolveNextLayoutFromDragEnd({
      layout: baseLayout(),
      activeId: libraryRowDragId(3),
      overId: canvasRowSortableId('row-2'),
    });

    expect(nextLayout?.layout).toHaveLength(3);
    expect(nextLayout?.layout[0]?.id).toBe('row-1');
    expect(nextLayout?.layout[2]?.id).toBe('row-2');
    expect(nextLayout?.layout[1]?.columns).toHaveLength(3);
  });

  it('when resolving active drag label, then maps ids to expected display labels', () => {
    expect(resolveDragLabel(libraryRowDragId(2))).toBe('Eilutė (2 st.)');
    expect(resolveDragLabel(libraryBlockDragId('notes'))).toBe('Pastabos');
    expect(resolveDragLabel(canvasInstanceDragId('inst-a'))).toBe('Blokas');
    expect(resolveDragLabel(canvasRowSortableId('row-1'))).toBe('Eilutė');
  });
});