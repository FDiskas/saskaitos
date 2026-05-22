import type { BlockKind, DataBlockKind, DecorBlockKind } from './layout';

export interface InvoiceTemplateBlockDefinition {
  kind: BlockKind;
  label: string;
}

export const DATA_BLOCK_DEFINITIONS: readonly InvoiceTemplateBlockDefinition[] = [
  { kind: 'logo', label: 'Logotipas' },
  { kind: 'seller-info', label: 'Pardavėjo info' },
  { kind: 'buyer-info', label: 'Pirkėjo info' },
  { kind: 'invoice-meta', label: 'Sąskaitos rekvizitai' },
  { kind: 'line-items', label: 'Prekių lentelė' },
  { kind: 'totals', label: 'Suma' },
  { kind: 'notes', label: 'Pastabos' },
  { kind: 'signature', label: 'Parašas' },
] as const;

export const DECOR_BLOCK_DEFINITIONS: readonly InvoiceTemplateBlockDefinition[] = [
  { kind: 'divider', label: 'Skirtukas' },
  { kind: 'custom-image', label: 'Paveikslėlis' },
  { kind: 'text', label: 'Tekstas' },
] as const;

export const INVOICE_TEMPLATE_BLOCKS: readonly InvoiceTemplateBlockDefinition[] = [
  ...DATA_BLOCK_DEFINITIONS,
  ...DECOR_BLOCK_DEFINITIONS,
];

export const ROW_LIBRARY_COLUMNS = [1, 2, 3, 4] as const;

export function blockLabel(kind: BlockKind): string {
  const match = INVOICE_TEMPLATE_BLOCKS.find((item) => item.kind === kind);
  return match?.label ?? kind;
}

export function isSingletonDataKind(kind: BlockKind): kind is DataBlockKind {
  return DATA_BLOCK_DEFINITIONS.some((definition) => definition.kind === kind);
}

export function isDecorKind(kind: BlockKind): kind is DecorBlockKind {
  return DECOR_BLOCK_DEFINITIONS.some((definition) => definition.kind === kind);
}
