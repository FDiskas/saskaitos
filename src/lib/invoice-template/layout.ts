import { z } from 'zod';

export const DataBlockKindSchema = z.enum([
  'logo',
  'seller-info',
  'buyer-info',
  'invoice-meta',
  'line-items',
  'totals',
  'notes',
  'signature',
]);
export type DataBlockKind = z.infer<typeof DataBlockKindSchema>;

export const DecorBlockKindSchema = z.enum(['divider', 'custom-image']);
export type DecorBlockKind = z.infer<typeof DecorBlockKindSchema>;

export const BlockKindSchema = z.enum([
  ...DataBlockKindSchema.options,
  ...DecorBlockKindSchema.options,
]);
export type BlockKind = z.infer<typeof BlockKindSchema>;

export type TemplateBlockId = DataBlockKind;
export const TemplateBlockIdSchema = DataBlockKindSchema;

export const DividerStyleSchema = z.enum(['solid', 'dashed', 'spacer']);
export type DividerStyle = z.infer<typeof DividerStyleSchema>;

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const AlignSchema = z.enum(['left', 'center', 'right']);
export type BlockAlign = z.infer<typeof AlignSchema>;

const BaseInstanceShape = {
  id: z.string().min(1),
  align: AlignSchema.default('left'),
  marginTop: z.number().int().min(0).max(120).default(0),
  marginBottom: z.number().int().min(0).max(120).default(0),
};

const DataBlockInstanceSchema = z.object({
  ...BaseInstanceShape,
  kind: DataBlockKindSchema,
});
export type DataBlockInstance = z.infer<typeof DataBlockInstanceSchema>;

const DividerBlockInstanceSchema = z.object({
  ...BaseInstanceShape,
  kind: z.literal('divider'),
  dividerStyle: DividerStyleSchema.default('solid'),
  dividerThickness: z.number().int().min(1).max(10).default(1),
  dividerColor: HexColorSchema.optional(),
});
export type DividerBlockInstance = z.infer<typeof DividerBlockInstanceSchema>;

const CustomImageBlockInstanceSchema = z.object({
  ...BaseInstanceShape,
  kind: z.literal('custom-image'),
  imageBase64: z.string().optional(),
  imageMaxWidthPct: z.number().int().min(10).max(100).default(100),
});
export type CustomImageBlockInstance = z.infer<typeof CustomImageBlockInstanceSchema>;

export const BlockInstanceSchema: z.ZodType<DataBlockInstance | DividerBlockInstance | CustomImageBlockInstance> =
  z.union([DataBlockInstanceSchema, DividerBlockInstanceSchema, CustomImageBlockInstanceSchema]);
export type BlockInstance = z.infer<typeof BlockInstanceSchema>;

export const InvoiceTemplateColumnSchema = z.object({
  id: z.string().min(1),
  content: z.array(BlockInstanceSchema).default([]),
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
});
export type InvoiceTemplateLayoutDto = z.infer<typeof InvoiceTemplateLayoutSchema>;

const DATA_KINDS: ReadonlySet<DataBlockKind> = new Set(DataBlockKindSchema.options);

function isDataBlockKind(value: string): value is DataBlockKind {
  return DATA_KINDS.has(value as DataBlockKind);
}

export function isDecorBlockKind(kind: BlockKind): kind is DecorBlockKind {
  return kind === 'divider' || kind === 'custom-image';
}

export function isDataBlockInstance(instance: BlockInstance): instance is DataBlockInstance {
  return isDataBlockKind(instance.kind);
}

function clampColumns(columnCount: number): number {
  if (columnCount < 1) return 1;
  if (columnCount > 4) return 4;
  return columnCount;
}

function defaultIdFactory(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createBlockInstance(kind: BlockKind, idFactory: () => string = () => defaultIdFactory(kind)): BlockInstance {
  if (kind === 'divider') {
    return {
      id: idFactory(),
      kind: 'divider',
      align: 'left',
      marginTop: 0,
      marginBottom: 0,
      dividerStyle: 'solid',
      dividerThickness: 1,
    };
  }
  if (kind === 'custom-image') {
    return {
      id: idFactory(),
      kind: 'custom-image',
      align: 'left',
      marginTop: 0,
      marginBottom: 0,
      imageMaxWidthPct: 100,
    };
  }
  return {
    id: idFactory(),
    kind,
    align: 'left',
    marginTop: 0,
    marginBottom: 0,
  };
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

function dataBlockInstance(kind: DataBlockKind, id: string): DataBlockInstance {
  return { id, kind, align: 'left', marginTop: 0, marginBottom: 0 };
}

export function defaultInvoiceTemplateLayout(): InvoiceTemplateLayoutDto {
  return {
    layout: [
      {
        id: 'row-1',
        type: 'row',
        columns: [
          { id: 'col-1-1', content: [dataBlockInstance('logo', 'inst-logo'), dataBlockInstance('seller-info', 'inst-seller')] },
          { id: 'col-1-2', content: [dataBlockInstance('invoice-meta', 'inst-meta')] },
        ],
      },
      {
        id: 'row-2',
        type: 'row',
        columns: [{ id: 'col-2-1', content: [dataBlockInstance('buyer-info', 'inst-buyer')] }],
      },
      {
        id: 'row-3',
        type: 'row',
        columns: [{ id: 'col-3-1', content: [dataBlockInstance('line-items', 'inst-items')] }],
      },
      {
        id: 'row-4',
        type: 'row',
        columns: [
          { id: 'col-4-1', content: [dataBlockInstance('notes', 'inst-notes')] },
          { id: 'col-4-2', content: [dataBlockInstance('totals', 'inst-totals')] },
        ],
      },
      {
        id: 'row-5',
        type: 'row',
        columns: [{ id: 'col-5-1', content: [dataBlockInstance('signature', 'inst-sig')] }],
      },
    ],
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

export function findBlockInstance(template: InvoiceTemplateLayoutDto, instanceId: string): BlockInstance | undefined {
  for (const row of template.layout) {
    for (const column of row.columns) {
      const found = column.content.find((item) => item.id === instanceId);
      if (found) return found;
    }
  }
  return undefined;
}

export function findDataBlockInstance(
  template: InvoiceTemplateLayoutDto,
  kind: DataBlockKind,
): BlockInstance | undefined {
  for (const row of template.layout) {
    for (const column of row.columns) {
      const found = column.content.find((item) => item.kind === kind);
      if (found) return found;
    }
  }
  return undefined;
}

function removeInstanceEverywhere(
  template: InvoiceTemplateLayoutDto,
  instanceId: string,
): InvoiceTemplateLayoutDto {
  return {
    ...template,
    layout: template.layout.map((row) => ({
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        content: column.content.filter((existing) => existing.id !== instanceId),
      })),
    })),
  };
}

export function moveBlockInstanceToColumn(
  template: InvoiceTemplateLayoutDto,
  instanceId: string,
  targetRowId: string,
  targetColumnId: string,
  beforeInstanceId?: string,
): InvoiceTemplateLayoutDto {
  const instance = findBlockInstance(template, instanceId);
  if (!instance) return template;

  const withoutInstance = removeInstanceEverywhere(template, instanceId);
  return insertInstance(withoutInstance, instance, targetRowId, targetColumnId, beforeInstanceId);
}

export function insertInstance(
  template: InvoiceTemplateLayoutDto,
  instance: BlockInstance,
  targetRowId: string,
  targetColumnId: string,
  beforeInstanceId?: string,
): InvoiceTemplateLayoutDto {
  return {
    ...template,
    layout: template.layout.map((row) => {
      if (row.id !== targetRowId) return row;
      return {
        ...row,
        columns: row.columns.map((column) => {
          if (column.id !== targetColumnId) return column;

          const nextContent = [...column.content];
          const insertIndex =
            beforeInstanceId !== undefined
              ? nextContent.findIndex((item) => item.id === beforeInstanceId)
              : -1;

          if (insertIndex >= 0) {
            nextContent.splice(insertIndex, 0, instance);
          } else {
            nextContent.push(instance);
          }

          return {
            ...column,
            content: nextContent,
          };
        }),
      };
    }),
  };
}

export function removeBlockInstanceFromTemplate(
  template: InvoiceTemplateLayoutDto,
  instanceId: string,
): InvoiceTemplateLayoutDto {
  return removeInstanceEverywhere(template, instanceId);
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
        return { ...row, columns: existingColumns };
      }

      const missing = nextColumnCount - existingColumns.length;
      const appended = Array.from({ length: missing }, (_, index) => ({
        id: defaultIdFactory(`${row.id}-col-${existingColumns.length + index + 1}`),
        content: [] as BlockInstance[],
      }));

      return { ...row, columns: [...existingColumns, ...appended] };
    }),
  };
}

export function removeTemplateRow(
  template: InvoiceTemplateLayoutDto,
  rowId: string,
): InvoiceTemplateLayoutDto {
  return { ...template, layout: template.layout.filter((row) => row.id !== rowId) };
}

export type CommonBlockSettings = Pick<BlockInstance, 'align' | 'marginTop' | 'marginBottom'>;

export function updateBlockInstance(
  template: InvoiceTemplateLayoutDto,
  instanceId: string,
  patch: Partial<BlockInstance>,
): InvoiceTemplateLayoutDto {
  return {
    ...template,
    layout: template.layout.map((row) => ({
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        content: column.content.map((instance) => {
          if (instance.id !== instanceId) return instance;
          return applyInstancePatch(instance, patch);
        }),
      })),
    })),
  };
}

function applyInstancePatch(instance: BlockInstance, patch: Partial<BlockInstance>): BlockInstance {
  const align = patch.align ?? instance.align;
  const marginTop = clampMargin(patch.marginTop ?? instance.marginTop);
  const marginBottom = clampMargin(patch.marginBottom ?? instance.marginBottom);

  if (instance.kind === 'divider') {
    return {
      ...instance,
      align,
      marginTop,
      marginBottom,
      dividerStyle:
        patch.kind === 'divider' && patch.dividerStyle !== undefined ? patch.dividerStyle : instance.dividerStyle,
      dividerThickness:
        patch.kind === 'divider' && patch.dividerThickness !== undefined
          ? clampThickness(patch.dividerThickness)
          : instance.dividerThickness,
      dividerColor:
        patch.kind === 'divider' && 'dividerColor' in patch ? patch.dividerColor : instance.dividerColor,
    };
  }

  if (instance.kind === 'custom-image') {
    return {
      ...instance,
      align,
      marginTop,
      marginBottom,
      imageBase64:
        patch.kind === 'custom-image' && 'imageBase64' in patch ? patch.imageBase64 : instance.imageBase64,
      imageMaxWidthPct:
        patch.kind === 'custom-image' && patch.imageMaxWidthPct !== undefined
          ? clampWidthPct(patch.imageMaxWidthPct)
          : instance.imageMaxWidthPct,
    };
  }

  return { ...instance, align, marginTop, marginBottom };
}

function clampMargin(value: number): number {
  return Math.max(0, Math.min(120, Math.round(value)));
}

function clampThickness(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function clampWidthPct(value: number): number {
  return Math.max(10, Math.min(100, Math.round(value)));
}
