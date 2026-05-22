import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CANVAS_PAGINATION_CONFIG,
  paginateCanvasRows,
} from './canvasPagination';
import type { InvoiceTemplateRowDto } from '@/lib/invoice-template/layout';

function createRow(id: string, blockCount: number, marginTop = 0, marginBottom = 0): InvoiceTemplateRowDto {
  return {
    id,
    type: 'row',
    columns: [
      {
        id: `${id}-col`,
        span: 1,
        content: Array.from({ length: blockCount }, (_, index) => ({
          id: `${id}-inst-${index}`,
          kind: 'notes',
          align: 'left',
          marginTop,
          marginBottom,
        })),
      },
    ],
  };
}

describe('paginateCanvasRows', () => {
  it('when there are no rows, then returns one empty page', () => {
    expect(paginateCanvasRows([])).toEqual([[]]);
  });

  it('when total estimated height fits one page, then keeps all rows in first page', () => {
    const rows = Array.from({ length: 9 }, (_, index) => createRow(`row-${index + 1}`, 1));

    const pages = paginateCanvasRows(rows, DEFAULT_CANVAS_PAGINATION_CONFIG);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(9);
  });

  it('when adding row exceeds page threshold, then starts new page', () => {
    const rows = Array.from({ length: 10 }, (_, index) => createRow(`row-${index + 1}`, 1));

    const pages = paginateCanvasRows(rows, DEFAULT_CANVAS_PAGINATION_CONFIG);

    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(9);
    expect(pages[1]).toHaveLength(1);
  });

  it('when row has large margins, then it is paginated according to margin-adjusted height', () => {
    const rows = [
      createRow('row-1', 1, 0, 0),
      createRow('row-2', 1, 0, 0),
      createRow('row-3', 1, 400, 400),
    ];

    const pages = paginateCanvasRows(rows, {
      pageContentHeight: 450,
      defaultRowHeight: 96,
      blockHeightEstimate: 84,
      rowBaseGap: 16,
    });

    expect(pages).toHaveLength(2);
    expect(pages[0]?.map((row) => row.id)).toEqual(['row-1', 'row-2']);
    expect(pages[1]?.map((row) => row.id)).toEqual(['row-3']);
  });
});
