import { describe, expect, it } from 'vitest';
import {
  createBlockInstance,
  createTemplateRow,
  findBlockInstance,
  mergeColumnWithRight,
  moveBlockInstanceToColumn,
  removeBlockInstanceFromTemplate,
  removeTemplateRow,
  reorderTemplateRows,
  resizeTemplateRowColumns,
  rowTotalSpan,
  splitColumn,
  updateBlockInstance,
  type BlockInstance,
  type InvoiceTemplateLayoutDto,
} from './layout';

function dataInstance(id: string, kind: 'seller-info' | 'buyer-info' | 'invoice-meta' | 'logo'): BlockInstance {
  return { id, kind, align: 'left', marginTop: 0, marginBottom: 0 };
}

function baseLayout(): InvoiceTemplateLayoutDto {
  return {
    layout: [
      {
        id: 'row-1',
        type: 'row',
        columns: [
          { id: 'col-1-1', span: 1, content: [dataInstance('inst-seller', 'seller-info')] },
          { id: 'col-1-2', span: 1, content: [dataInstance('inst-meta', 'invoice-meta')] },
        ],
      },
      {
        id: 'row-2',
        type: 'row',
        columns: [{ id: 'col-2-1', span: 1, content: [dataInstance('inst-buyer', 'buyer-info')] }],
      },
    ],
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

  it('when moving instance to another column, then instance exists only in target', () => {
    const moved = moveBlockInstanceToColumn(baseLayout(), 'inst-seller', 'row-2', 'col-2-1');

    expect(moved.layout[0]?.columns[0]?.content).toEqual([]);
    expect(moved.layout[1]?.columns[0]?.content.map((item) => item.id)).toEqual(['inst-buyer', 'inst-seller']);
  });

  it('when moving instance before another in target column, then inserts before hovered instance', () => {
    const moved = moveBlockInstanceToColumn(baseLayout(), 'inst-seller', 'row-2', 'col-2-1', 'inst-buyer');

    expect(moved.layout[1]?.columns[0]?.content.map((item) => item.id)).toEqual(['inst-seller', 'inst-buyer']);
  });

  it('when reordering within same column, then updates instance order', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            {
              id: 'col-1-1',
              span: 1,
              content: [
                dataInstance('inst-logo', 'logo'),
                dataInstance('inst-seller', 'seller-info'),
                dataInstance('inst-meta', 'invoice-meta'),
              ],
            },
          ],
        },
      ],
    };

    const moved = moveBlockInstanceToColumn(layout, 'inst-meta', 'row-1', 'col-1-1', 'inst-seller');

    expect(moved.layout[0]?.columns[0]?.content.map((item) => item.id)).toEqual([
      'inst-logo',
      'inst-meta',
      'inst-seller',
    ]);
  });

  it('when increasing row columns, then keeps existing content and appends empty columns', () => {
    const resized = resizeTemplateRowColumns(baseLayout(), 'row-2', 3);

    expect(resized.layout[1]?.columns).toHaveLength(3);
    expect(resized.layout[1]?.columns[0]?.content.map((item) => item.id)).toEqual(['inst-buyer']);
    expect(resized.layout[1]?.columns[1]?.content).toEqual([]);
  });

  it('when decreasing row columns, then truncates extra columns', () => {
    const resized = resizeTemplateRowColumns(baseLayout(), 'row-1', 1);

    expect(resized.layout[0]?.columns).toHaveLength(1);
    expect(resized.layout[0]?.columns[0]?.content.map((item) => item.id)).toEqual(['inst-seller']);
  });

  it('when updating instance settings, then values are persisted and bounded', () => {
    const updated = updateBlockInstance(baseLayout(), 'inst-seller', {
      align: 'right',
      marginTop: 24,
      marginBottom: 180,
    });

    const instance = findBlockInstance(updated, 'inst-seller');
    expect(instance?.align).toBe('right');
    expect(instance?.marginTop).toBe(24);
    expect(instance?.marginBottom).toBe(120);
  });

  it('when removing instance, then content is filtered', () => {
    const removed = removeBlockInstanceFromTemplate(baseLayout(), 'inst-seller');
    expect(removed.layout[0]?.columns[0]?.content).toEqual([]);
    expect(findBlockInstance(removed, 'inst-seller')).toBeUndefined();
  });

  it('when removing row, then row is deleted from layout', () => {
    const removed = removeTemplateRow(baseLayout(), 'row-1');

    expect(removed.layout).toHaveLength(1);
    expect(removed.layout[0]?.id).toBe('row-2');
  });

  it('when creating divider instance, then defaults are set', () => {
    const divider = createBlockInstance('divider', () => 'inst-divider-1');
    if (divider.kind !== 'divider') throw new Error('expected divider');

    expect(divider.id).toBe('inst-divider-1');
    expect(divider.dividerStyle).toBe('solid');
    expect(divider.dividerThickness).toBe(1);
  });

  it('when creating custom-image instance, then default width is full', () => {
    const image = createBlockInstance('custom-image', () => 'inst-image-1');
    if (image.kind !== 'custom-image') throw new Error('expected custom-image');

    expect(image.imageMaxWidthPct).toBe(100);
    expect(image.imageBase64).toBeUndefined();
  });

  it('when creating amount-in-words instance, then it is a plain data block instance', () => {
    const instance = createBlockInstance('amount-in-words', () => 'inst-words-1');

    expect(instance).toEqual({
      id: 'inst-words-1',
      kind: 'amount-in-words',
      align: 'left',
      marginTop: 0,
      marginBottom: 0,
    });
  });

  it('when allowing multiple dividers per layout, then both coexist', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            {
              id: 'col-1-1',
              span: 1,
              content: [
                createBlockInstance('divider', () => 'div-1'),
                createBlockInstance('divider', () => 'div-2'),
              ],
            },
          ],
        },
      ],
    };

    expect(layout.layout[0]?.columns[0]?.content).toHaveLength(2);
    expect(findBlockInstance(layout, 'div-1')?.kind).toBe('divider');
    expect(findBlockInstance(layout, 'div-2')?.kind).toBe('divider');
  });

  it('when updating divider settings, then style + thickness change', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            {
              id: 'col-1-1',
              span: 1,
              content: [createBlockInstance('divider', () => 'div-1')],
            },
          ],
        },
      ],
    };

    const updated = updateBlockInstance(layout, 'div-1', {
      kind: 'divider',
      dividerStyle: 'dashed',
      dividerThickness: 50,
    });
    const instance = findBlockInstance(updated, 'div-1');
    if (instance?.kind !== 'divider') throw new Error('expected divider');

    expect(instance.dividerStyle).toBe('dashed');
    expect(instance.dividerThickness).toBe(10);
  });

  it('when merging column with right neighbour, then one column with summed span and concatenated content', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            { id: 'col-a', span: 1, content: [dataInstance('inst-a', 'seller-info')] },
            { id: 'col-b', span: 1, content: [dataInstance('inst-b', 'invoice-meta')] },
            { id: 'col-c', span: 1, content: [dataInstance('inst-c', 'buyer-info')] },
          ],
        },
      ],
    };

    const merged = mergeColumnWithRight(layout, 'row-1', 'col-a');
    const row = merged.layout[0];
    if (!row) throw new Error('row missing');

    expect(row.columns).toHaveLength(2);
    expect(row.columns[0]?.id).toBe('col-a');
    expect(row.columns[0]?.span).toBe(2);
    expect(row.columns[0]?.content.map((item) => item.id)).toEqual(['inst-a', 'inst-b']);
    expect(row.columns[1]?.id).toBe('col-c');
    expect(rowTotalSpan(row)).toBe(3);
  });

  it('when merging last column right, then layout is unchanged', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            { id: 'col-a', span: 1, content: [] },
            { id: 'col-b', span: 1, content: [] },
          ],
        },
      ],
    };

    const merged = mergeColumnWithRight(layout, 'row-1', 'col-b');
    expect(merged.layout[0]?.columns).toHaveLength(2);
  });

  it('when splitting span 3 column, then yields 3 span-1 columns with content kept in first', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [
            { id: 'col-wide', span: 3, content: [dataInstance('inst-content', 'seller-info')] },
            { id: 'col-tail', span: 1, content: [] },
          ],
        },
      ],
    };

    const split = splitColumn(layout, 'row-1', 'col-wide');
    const row = split.layout[0];
    if (!row) throw new Error('row missing');

    expect(row.columns).toHaveLength(4);
    expect(row.columns[0]?.id).toBe('col-wide');
    expect(row.columns[0]?.span).toBe(1);
    expect(row.columns[0]?.content.map((item) => item.id)).toEqual(['inst-content']);
    expect(row.columns[1]?.span).toBe(1);
    expect(row.columns[1]?.content).toEqual([]);
    expect(row.columns[3]?.id).toBe('col-tail');
    expect(rowTotalSpan(row)).toBe(4);
  });

  it('when splitting span 1 column, then layout is unchanged', () => {
    const layout: InvoiceTemplateLayoutDto = {
      layout: [
        {
          id: 'row-1',
          type: 'row',
          columns: [{ id: 'col-a', span: 1, content: [] }],
        },
      ],
    };

    const split = splitColumn(layout, 'row-1', 'col-a');
    expect(split.layout[0]?.columns).toHaveLength(1);
    expect(split.layout[0]?.columns[0]?.span).toBe(1);
  });
});
