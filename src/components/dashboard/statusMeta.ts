import type { InvoiceStatus } from '@/lib/domain';
import { translate } from '@/lib/translate';

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const STYLES: Record<InvoiceStatus, Pick<StatusMeta, 'badgeClass' | 'dotClass'>> = {
  draft: {
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200',
    dotClass: 'bg-slate-400',
  },
  sent: {
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-200',
    dotClass: 'bg-blue-500',
  },
  paid: {
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  overdue: {
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200',
    dotClass: 'bg-rose-500',
  },
};

const LABEL_KEYS: Record<InvoiceStatus, keyof typeof translate> = {
  draft: 'invoice.status.draft',
  sent: 'invoice.status.sent',
  paid: 'invoice.status.paid',
  overdue: 'invoice.status.overdue',
};

export const ALL_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue'];

export function statusMeta(status: InvoiceStatus, t: typeof translate = translate): StatusMeta {
  return {
    label: t[LABEL_KEYS[status]] as string,
    ...STYLES[status],
  };
}
