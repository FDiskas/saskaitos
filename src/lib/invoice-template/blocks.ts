import { translate } from '@/lib/translate';
import type { BlockKind, DataBlockKind, DecorBlockKind } from './layout';

export interface InvoiceTemplateBlockDefinition {
  kind: BlockKind;
  labelKey: keyof typeof translate;
}

export const DATA_BLOCK_DEFINITIONS: readonly InvoiceTemplateBlockDefinition[] = [
  { kind: 'logo', labelKey: 'invoice.blocks.logo' },
  { kind: 'seller-info', labelKey: 'invoice.blocks.sellerInfo' },
  { kind: 'buyer-info', labelKey: 'invoice.blocks.buyerInfo' },
  { kind: 'invoice-meta', labelKey: 'invoice.blocks.invoiceMeta' },
  { kind: 'line-items', labelKey: 'invoice.blocks.lineItems' },
  { kind: 'totals', labelKey: 'invoice.blocks.totals' },
  { kind: 'amount-in-words', labelKey: 'invoice.blocks.amountInWords' },
  { kind: 'notes', labelKey: 'invoice.blocks.notes' },
  { kind: 'signature', labelKey: 'invoice.blocks.signature' },
] as const;

export const DECOR_BLOCK_DEFINITIONS: readonly InvoiceTemplateBlockDefinition[] = [
  { kind: 'divider', labelKey: 'invoice.blocks.divider' },
  { kind: 'custom-image', labelKey: 'invoice.blocks.customImage' },
  { kind: 'text', labelKey: 'invoice.blocks.text' },
] as const;

export const INVOICE_TEMPLATE_BLOCKS: readonly InvoiceTemplateBlockDefinition[] = [
  ...DATA_BLOCK_DEFINITIONS,
  ...DECOR_BLOCK_DEFINITIONS,
];

export const ROW_LIBRARY_COLUMNS = [1, 2, 3, 4] as const;

export function blockLabel(kind: BlockKind, t: typeof translate = translate): string {
  const match = INVOICE_TEMPLATE_BLOCKS.find((item) => item.kind === kind);
  if (!match) return kind;
  return t[match.labelKey] as string;
}

export function isSingletonDataKind(kind: BlockKind): kind is DataBlockKind {
  return DATA_BLOCK_DEFINITIONS.some((definition) => definition.kind === kind);
}

export function isDecorKind(kind: BlockKind): kind is DecorBlockKind {
  return DECOR_BLOCK_DEFINITIONS.some((definition) => definition.kind === kind);
}
