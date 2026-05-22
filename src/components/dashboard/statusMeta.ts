import type { InvoiceStatus } from '@/lib/domain';

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const META: Record<InvoiceStatus, StatusMeta> = {
  draft: {
    label: 'Juodraštis',
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200',
    dotClass: 'bg-slate-400',
  },
  sent: {
    label: 'Išsiųsta',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-200',
    dotClass: 'bg-blue-500',
  },
  paid: {
    label: 'Apmokėta',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  overdue: {
    label: 'Vėluoja',
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200',
    dotClass: 'bg-rose-500',
  },
};

export const ALL_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue'];

export function statusMeta(status: InvoiceStatus): StatusMeta {
  return META[status];
}
