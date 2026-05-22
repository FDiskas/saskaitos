import type { TemplateBlockId } from './layout';

export interface InvoiceTemplateBlockDefinition {
  id: TemplateBlockId;
  label: string;
}

export const INVOICE_TEMPLATE_BLOCKS: readonly InvoiceTemplateBlockDefinition[] = [
  { id: 'logo', label: 'Logotipas' },
  { id: 'seller-info', label: 'Pardavėjo info' },
  { id: 'buyer-info', label: 'Pirkėjo info' },
  { id: 'invoice-meta', label: 'Sąskaitos rekvizitai' },
  { id: 'line-items', label: 'Prekių lentelė' },
  { id: 'totals', label: 'Suma' },
  { id: 'notes', label: 'Pastabos' },
  { id: 'signature', label: 'Parašas' },
] as const;

export const ROW_LIBRARY_COLUMNS = [1, 2, 3, 4] as const;

export function blockLabel(blockId: TemplateBlockId): string {
  const match = INVOICE_TEMPLATE_BLOCKS.find((item) => item.id === blockId);
  return match?.label ?? blockId;
}
