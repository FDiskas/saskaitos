import { type InvoiceTemplateRowDto } from '@/lib/invoice-template/layout';

export interface CanvasPaginationConfig {
  pageContentHeight: number;
  defaultRowHeight: number;
  blockHeightEstimate: number;
  rowBaseGap: number;
}

export const DEFAULT_CANVAS_PAGINATION_CONFIG: CanvasPaginationConfig = {
  pageContentHeight: 1027,
  defaultRowHeight: 96,
  blockHeightEstimate: 84,
  rowBaseGap: 16,
};

export function paginateCanvasRows(
  rows: InvoiceTemplateRowDto[],
  config: CanvasPaginationConfig = DEFAULT_CANVAS_PAGINATION_CONFIG,
): InvoiceTemplateRowDto[][] {
  const pages: InvoiceTemplateRowDto[][] = [];
  let currentPage: InvoiceTemplateRowDto[] = [];
  let currentHeight = 0;

  for (const row of rows) {
    const maxMargins = row.columns.reduce((maxValue, column) => {
      const margins = column.content.reduce((sum, instance) => sum + instance.marginTop + instance.marginBottom, 0);
      return Math.max(maxValue, margins);
    }, 0);

    const densestColumnBlocks = row.columns.reduce((maxValue, column) => Math.max(maxValue, column.content.length), 0);
    const estimatedContentHeight = Math.max(
      config.defaultRowHeight,
      densestColumnBlocks * config.blockHeightEstimate,
    );
    const estimatedRowHeight = estimatedContentHeight + maxMargins + config.rowBaseGap;

    if (currentPage.length > 0 && currentHeight + estimatedRowHeight > config.pageContentHeight) {
      pages.push(currentPage);
      currentPage = [row];
      currentHeight = estimatedRowHeight;
      continue;
    }

    currentPage.push(row);
    currentHeight += estimatedRowHeight;
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages.length > 0 ? pages : [[]];
}
