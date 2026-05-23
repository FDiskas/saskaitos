---
name: invoice-company-scoping
description: Invoices carry optional companyId; dashboard implicitly filters by active company; legacy entries fall back to first profile.
keywords: invoice, company, multi-company, filter, dashboard, companyId, legacy, fallback
created: 2026-05-23
updated: 2026-05-23
metadata:
  type: decisions
---

**Fact / Rule:** `Invoice` (domain), `InvoiceDto`, `InvoiceIndexEntry`, and `InvoiceSummary` all carry optional `companyId: string`. `useCreateInvoice` stamps the active company id (`settings.activeCompanyId ?? settings.companies[0]?.id`). The dashboard implicitly filters all summaries by current `activeCompanyId` (not via UI filter, not user-removable). Clients remain global (not per-company), so `ClientCombobox` in the invoice editor shows all clients regardless of active company.

**Why:** User asked: top dropdown selecting legal entity should scope dashboard to only that company's invoices, while invoice editor's client picker should stay global (clients are shared). Drive layout is per-client folders, so the company filter is layered on top of the existing per-client index files via `companyId` field.

**How to apply:**
- Legacy index entries without `companyId` are resolved on read in `useInvoiceList` → `entryToSummary` to `settings.companies[0]?.id` (first profile fallback), so single-company users keep seeing all legacy invoices.
- Never put `companyId` filter into `DashboardFilterValues` UI — keep it implicit at the route layer.
- Do not scope clients per company; `useClients` returns all clients globally.
- Editor's `CompanyProfileSwitcher` does NOT reassign the loaded invoice's `companyId`. Switching the active company only changes which profile is "active" for new invoices and design defaults.

Related: [[no-backend-architecture]] — companyId is just another field in Drive JSON, no infra change.
