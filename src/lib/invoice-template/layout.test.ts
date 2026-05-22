import { describe, expect, it } from 'vitest';
import {
  createTemplateRow,
  readTemplateBlockSettings,
  removeTemplateRow,
  removeBlockFromTemplate,
  moveBlockToColumn,
  reorderTemplateRows,
  resizeTemplateRowColumns,
  updateTemplateBlockSettings,
  type InvoiceTemplateLayoutDto,
} from './layout';

function baseLayout(): InvoiceTemplateLayoutDto {
  return {
    layout: [
      {
        id: 'row-1',
        type: 'row',
        columns: [
          { id: 'col-1-1', content: ['seller-info'] },
          { id: 'col-1-2', content: ['invoice-meta'] },
        ],
      },
      {
        id: 'row-2',
        type: 'row',
        columns: [{ id: 'col-2-1', content: ['buyer-info'] }],
      },
    ],
    blockSettings: {},
  };
}

describe('invoice template layout', () => {
  it('when creating row with custom columns, then creates expected placeholders', () => {
    const row = createTemplateRow(3, () => 'row-99', (index) => `col-99-${index + 1}`);

    expect(row.id).toBe('row-99');
    expect(row.columns).toHaveLength(3);
    expect(row.columns[0]?.id).toBe('col-99-1');
    expect(row.columns[2]?.id).toBe('col-99-3');
  });

  it('when reordering rows, then keeps all rows but changes order', () => {
    const reordered = reorderTemplateRows(baseLayout(), 'row-2', 'row-1');

    expect(reordered.layout[0]?.id).toBe('row-2');
    expect(reordered.layout[1]?.id).toBe('row-1');
  });

  it('when moving block to another column, then block exists only in target', () => {
    const moved = moveBlockToColumn(baseLayout(), 'seller-info', 'row-2', 'col-2-1');

    expect(moved.layout[0]?.columns[0]?.content).toEqual([]);
    expect(moved.layout[1]?.columns[0]?.content).toEqual(['buyer-info', 'seller-info']);
  });

  it('when moving block before another in target column, then inserts before hovered block', () => {
    const moved = moveBlockToColumn(baseLayout(), 'seller-info', 'row-2', 'col-2-1', 'buyer-info');

    expect(moved.layout[1]?.columns[0]?.content).toEqual(['seller-info', 'buyer-info']);
  });

  it('when reordering within same column, then updates block order', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [{ id: 'col-1-1', content: ['logo', 'seller-info', 'invoice-meta'] }],
        },
      ],
      blockSettings: {},
    };

    const moved = moveBlockToColumn(layout, 'invoice-meta', 'row-1', 'col-1-1', 'seller-info');

    expect(moved.layout[0]?.columns[0]?.content).toEqual(['logo', 'invoice-meta', 'seller-info']);
  });

  it('when increasing row columns, then keeps existing content and appends empty columns', () => {
    const resized = resizeTemplateRowColumns(baseLayout(), 'row-2', 3);

    expect(resized.layout[1]?.columns).toHaveLength(3);
    expect(resized.layout[1]?.columns[0]?.content).toEqual(['buyer-info']);
    expect(resized.layout[1]?.columns[1]?.content).toEqual([]);
  });

  it('when decreasing row columns, then truncates extra columns', () => {
    const resized = resizeTemplateRowColumns(baseLayout(), 'row-1', 1);

    expect(resized.layout[0]?.columns).toHaveLength(1);
    expect(resized.layout[0]?.columns[0]?.content).toEqual(['seller-info']);
  });

  it('when updating block settings, then values are persisted and bounded', () => {
    const updated = updateTemplateBlockSettings(baseLayout(), 'seller-info', {
      align: 'right',
      marginTop: 24,
      marginBottom: 180,
    });

    const settings = readTemplateBlockSettings(updated, 'seller-info');
    expect(settings.align).toBe('right');
    expect(settings.marginTop).toBe(24);
    expect(settings.marginBottom).toBe(120);
  });

  it('when removing block from template, then content and settings are removed', () => {
    const withSettings = updateTemplateBlockSettings(baseLayout(), 'seller-info', {
      marginTop: 16,
    });

    const removed = removeBlockFromTemplate(withSettings, 'seller-info');
    expect(removed.layout[0]?.columns[0]?.content).toEqual([]);
    expect(removed.blockSettings['seller-info']).toBeUndefined();
  });

  it('when removing row, then row is deleted from layout', () => {
    const removed = removeTemplateRow(baseLayout(), 'row-1');

    expect(removed.layout).toHaveLength(1);
    expect(removed.layout[0]?.id).toBe('row-2');
  });
});
