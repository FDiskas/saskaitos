import { type Invoice, type InvoiceStatus } from './Invoice';

export function applyStatus(invoice: Invoice, target: InvoiceStatus): Invoice {
  if (target === 'draft') return invoice.markDraft();
  if (target === 'sent') return invoice.markSent();
  if (target === 'paid') return invoice.markPaid();
  return invoice.markOverdue();
}
