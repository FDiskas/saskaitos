import { z } from 'zod';

export const TemplateBlockIdSchema = z.enum([
  'logo',
  'seller-info',
  'buyer-info',
  'invoice-meta',
  'line-items',
  'totals',
  'notes',
  'signature',
]);
export type TemplateBlockId = z.infer<typeof TemplateBlockIdSchema>;

export const InvoiceTemplateColumnSchema = z.object({
  id: z.string().min(1),
  content: z.array(TemplateBlockIdSchema).default([]),
});
export type InvoiceTemplateColumnDto = z.infer<typeof InvoiceTemplateColumnSchema>;

export const InvoiceTemplateRowSchema = z.object({
  id: z.string().min(1),
  type: z.literal('row'),
  columns: z.array(InvoiceTemplateColumnSchema).min(1).max(4),
});
export type InvoiceTemplateRowDto = z.infer<typeof InvoiceTemplateRowSchema>;

export const InvoiceTemplateLayoutSchema = z.object({
  layout: z.array(InvoiceTemplateRowSchema).default([]),
  blockSettings: z
    .record(
      TemplateBlockIdSchema,
      z.object({
        align: z.enum(['left', 'center', 'right']).default('left'),
        marginTop: z.number().int().min(0).max(120).default(0),
        marginBottom: z.number().int().min(0).max(120).default(0),
      }),
    )
    .default({}),
});
export type InvoiceTemplateLayoutDto = z.infer<typeof InvoiceTemplateLayoutSchema>;
export type TemplateBlockSettings = NonNullable<InvoiceTemplateLayoutDto['blockSettings'][TemplateBlockId]>;

function clampColumns(columnCount: number): number {
  if (columnCount < 1) return 1;
  if (columnCount > 4) return 4;
  return columnCount;
}

function defaultIdFactory(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function mapColumns(
  count: number,
  columnIdFactory: (rowId: string, index: number) => string,
  rowId: string,
): InvoiceTemplateColumnDto[] {
  return Array.from({ length: clampColumns(count) }, (_, index) => ({
    id: columnIdFactory(rowId, index),
    content: [],
  }));
}

export function createTemplateRow(
  columnCount: number,
  rowIdFactory: () => string = () => defaultIdFactory('row'),
  columnIdFactory: (index: number) => string = (index) => defaultIdFactory(`col-${index + 1}`),
): InvoiceTemplateRowDto {
  const rowId = rowIdFactory();
  return {
    id: rowId,
    type: 'row',
    columns: mapColumns(clampColumns(columnCount), (_rowId, index) => columnIdFactory(index), rowId),
  };
}

export function defaultInvoiceTemplateLayout(): InvoiceTemplateLayoutDto {
  return {
    layout: [
      {
        id: 'row-1',
        type: 'row',
        columns: [
          { id: 'col-1-1', content: ['logo', 'seller-info'] },
          { id: 'col-1-2', content: ['invoice-meta'] },
        ],
      },
      {
        id: 'row-2',
        type: 'row',
        columns: [{ id: 'col-2-1', content: ['buyer-info'] }],
      },
      {
        id: 'row-3',
        type: 'row',
        columns: [{ id: 'col-3-1', content: ['line-items'] }],
      },
      {
        id: 'row-4',
        type: 'row',
        columns: [
          { id: 'col-4-1', content: ['notes'] },
          { id: 'col-4-2', content: ['totals'] },
        ],
      },
      {
        id: 'row-5',
        type: 'row',
        columns: [{ id: 'col-5-1', content: ['signature'] }],
      },
    ],
    blockSettings: {},
  };
}

export function reorderTemplateRows(
  template: InvoiceTemplateLayoutDto,
  activeRowId: string,
  overRowId: string,
): InvoiceTemplateLayoutDto {
  const sourceIndex = template.layout.findIndex((row) => row.id === activeRowId);
  const targetIndex = template.layout.findIndex((row) => row.id === overRowId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return template;

  const nextRows = [...template.layout];
  const [movedRow] = nextRows.splice(sourceIndex, 1);
  if (!movedRow) return template;
  nextRows.splice(targetIndex, 0, movedRow);

  return { ...template, layout: nextRows };
}

function removeBlockEverywhere(
  template: InvoiceTemplateLayoutDto,
  blockId: TemplateBlockId,
): InvoiceTemplateLayoutDto {
  return {
    ...template,
    layout: template.layout.map((row) => ({
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        content: column.content.filter((existing) => existing !== blockId),
      })),
    })),
  };
}

export function moveBlockToColumn(
  template: InvoiceTemplateLayoutDto,
  blockId: TemplateBlockId,
  targetRowId: string,
  targetColumnId: string,
): InvoiceTemplateLayoutDto {
  const withoutBlock = removeBlockEverywhere(template, blockId);

  return {
    ...withoutBlock,
    layout: withoutBlock.layout.map((row) => {
      if (row.id !== targetRowId) return row;
      return {
        ...row,
        columns: row.columns.map((column) => {
          if (column.id !== targetColumnId) return column;
          return {
            ...column,
            content: [...column.content, blockId],
          };
        }),
      };
    }),
  };
}

export function removeBlockFromTemplate(
  template: InvoiceTemplateLayoutDto,
  blockId: TemplateBlockId,
): InvoiceTemplateLayoutDto {
  const withoutBlock = removeBlockEverywhere(template, blockId);
  const nextBlockSettings = { ...(withoutBlock.blockSettings ?? {}) };
  delete nextBlockSettings[blockId];
  return {
    ...withoutBlock,
    blockSettings: nextBlockSettings,
  };
}

export function resizeTemplateRowColumns(
  template: InvoiceTemplateLayoutDto,
  rowId: string,
  columnCount: number,
): InvoiceTemplateLayoutDto {
  const nextColumnCount = clampColumns(columnCount);
  return {
    ...template,
    layout: template.layout.map((row) => {
      if (row.id !== rowId) return row;

      const existingColumns = row.columns.slice(0, nextColumnCount);
      if (existingColumns.length === nextColumnCount) {
        return {
          ...row,
          columns: existingColumns,
        };
      }

      const missing = nextColumnCount - existingColumns.length;
      const appended = Array.from({ length: missing }, (_, index) => ({
        id: defaultIdFactory(`${row.id}-col-${existingColumns.length + index + 1}`),
        content: [] as TemplateBlockId[],
      }));

      return {
        ...row,
        columns: [...existingColumns, ...appended],
      };
    }),
  };
}

export function removeTemplateRow(
  template: InvoiceTemplateLayoutDto,
  rowId: string,
): InvoiceTemplateLayoutDto {
  return {
    ...template,
    layout: template.layout.filter((row) => row.id !== rowId),
  };
}

export function defaultTemplateBlockSettings(): TemplateBlockSettings {
  return {
    align: 'left',
    marginTop: 0,
    marginBottom: 0,
  };
}

export function readTemplateBlockSettings(
  template: InvoiceTemplateLayoutDto,
  blockId: TemplateBlockId,
): TemplateBlockSettings {
  return template.blockSettings?.[blockId] ?? defaultTemplateBlockSettings();
}

export function updateTemplateBlockSettings(
  template: InvoiceTemplateLayoutDto,
  blockId: TemplateBlockId,
  patch: Partial<TemplateBlockSettings>,
): InvoiceTemplateLayoutDto {
  const current = readTemplateBlockSettings(template, blockId);
  const next: TemplateBlockSettings = {
    align: patch.align ?? current.align,
    marginTop: Math.max(0, Math.min(120, Math.round(patch.marginTop ?? current.marginTop))),
    marginBottom: Math.max(0, Math.min(120, Math.round(patch.marginBottom ?? current.marginBottom))),
  };
  return {
    ...template,
    blockSettings: {
      ...(template.blockSettings ?? {}),
      [blockId]: next,
    },
  };
}
