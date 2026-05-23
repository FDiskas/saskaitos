import type { ClientId, InvoiceStatus, InvoiceSummary } from '@/lib/domain';

export interface InvoiceFilters {
  search?: string;
  clientId?: ClientId | null;
  statuses?: InvoiceStatus[];
  dateFrom?: Date | null;
  dateTo?: Date | null;
  companyId?: string | null;
}

function matchesSearch(s: InvoiceSummary, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (q.length === 0) return true;
  return s.number.toLowerCase().includes(q) || s.clientName.toLowerCase().includes(q);
}

function matchesClient(s: InvoiceSummary, clientId: ClientId | null | undefined): boolean {
  if (!clientId) return true;
  return s.clientId.equals(clientId);
}

function matchesStatuses(
  s: InvoiceSummary,
  statuses: InvoiceStatus[] | undefined,
  today: Date,
): boolean {
  if (!statuses || statuses.length === 0) return true;
  return statuses.includes(s.effectiveStatus(today));
}

function matchesDateRange(
  s: InvoiceSummary,
  from: Date | null | undefined,
  to: Date | null | undefined,
): boolean {
  const t = s.issueDate.getTime();
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
}

function matchesCompany(s: InvoiceSummary, companyId: string | null | undefined): boolean {
  if (!companyId) return true;
  return s.companyId === companyId;
}

export function filterSummaries(
  list: InvoiceSummary[],
  filters: InvoiceFilters,
  today: Date,
): InvoiceSummary[] {
  return list.filter(
    (s) =>
      matchesSearch(s, filters.search ?? '') &&
      matchesClient(s, filters.clientId ?? null) &&
      matchesStatuses(s, filters.statuses, today) &&
      matchesDateRange(s, filters.dateFrom ?? null, filters.dateTo ?? null) &&
      matchesCompany(s, filters.companyId ?? null),
  );
}
