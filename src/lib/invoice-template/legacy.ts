import { DataBlockKindSchema, type BlockInstance, type DataBlockKind } from './layout';

interface LegacyBlockSettings {
  align?: 'left' | 'center' | 'right';
  marginTop?: number;
  marginBottom?: number;
}

type LegacyColumnContentItem = string | Record<string, unknown>;

interface LegacyColumn {
  id?: string;
  content?: LegacyColumnContentItem[];
}

interface LegacyRow {
  id?: string;
  type?: 'row';
  columns?: LegacyColumn[];
}

interface LegacyLayout {
  layout?: LegacyRow[];
  blockSettings?: Record<string, LegacyBlockSettings>;
}

const DATA_KINDS_SET: ReadonlySet<DataBlockKind> = new Set(DataBlockKindSchema.options);

export function migrateLegacyLayoutInput(input: unknown): unknown {
  if (!isObject(input)) return input;
  const layout = input as LegacyLayout;
  if (!Array.isArray(layout.layout)) return input;

  const legacySettings = layout.blockSettings ?? {};

  const migrated = layout.layout.map((row) => ({
    ...row,
    columns: (row.columns ?? []).map((column) => ({
      ...column,
      span: typeof column === 'object' && column !== null && typeof (column as { span?: unknown }).span === 'number'
        ? (column as { span: number }).span
        : 1,
      content: (column.content ?? []).map((item) => migrateItem(item, legacySettings)),
    })),
  }));

  return { layout: migrated };
}

function migrateItem(
  item: LegacyColumnContentItem,
  legacySettings: Record<string, LegacyBlockSettings>,
): BlockInstance | LegacyColumnContentItem {
  if (typeof item !== 'string') return item;
  if (!isLegacyDataKind(item)) return item;

  const settings = legacySettings[item] ?? {};
  return {
    id: `legacy-${item}`,
    kind: item,
    align: settings.align ?? 'left',
    marginTop: settings.marginTop ?? 0,
    marginBottom: settings.marginBottom ?? 0,
  };
}

function isLegacyDataKind(value: string): value is DataBlockKind {
  return DATA_KINDS_SET.has(value as DataBlockKind);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
