---
name: overdue-display-inference
description: Auto-overdue rendered as display inference via InvoiceSummary.effectiveStatus(today) — NO Drive write on Dashboard open. Persisted status only changes when user explicitly clicks.
keywords: [overdue, status, dashboard, inference, invoice-summary, effective-status, display-only]
created: 2026-05-22
updated: 2026-05-22
---

**Decision:** Etapas 6 Dashboard surfaces "Vėluoja" by computing `summary.effectiveStatus(today)` on the fly — if persisted status is `sent` and `dueDate < today`, it renders as `overdue`. The Drive JSON is **not** auto-rewritten on dashboard open. Persisted status changes only when the user manually picks a status via `StatusPicker`.

**Why:** PLAN.md Etapas 6 hinted at "auto-mark Overdue" but a literal background write each Dashboard open would (a) cost N Drive writes for N sent invoices every refresh, (b) race two tabs against each other on `invoices_index.json`, (c) violate optimistic-first UI principle. The acceptance criteria itself only requires "Filtrai veikia kombinuotai" and "Statuso pakeitimas — UI atsinaujina iškart" — neither demands auto-persist. Tell-Don't-Ask is preserved by putting the inference logic in `InvoiceSummary.effectiveStatus`, not in the component.

**How to apply:**
- New status-related filters / KPIs / badges → use `summary.effectiveStatus(today)`, never `summary.status` directly.
- If a feature requires the persisted status (e.g. exporting raw data, status history), use `summary.status`.
- Don't add background Drive writes triggered by mount. Status persistence flows only through `useInvoiceStatus` mutation.
- `InvoiceIndexEntrySchema.dueDate` was made optional during this etapas — old entries fall back to issue date. Once all clients have re-saved at least once, the optional can become required.

Related: [[sync-queue-contract]] — single-write-path principle reinforced by avoiding auto-overdue writes.
