---
name: shared-app-header
description: Dashboard, clients, and settings pages share `AppHeader` (src/components/shared/AppHeader.tsx) with responsive hamburger menu below md breakpoint.
keywords: header, navigation, responsive, mobile, hamburger, app-header, layout
created: 2026-05-23
updated: 2026-05-23
metadata:
  type: project
---

**Fact / Rule:** `AppHeader` is the single source for the top nav across dashboard / clients / settings routes. Below `md` (768px) the inline nav links collapse into a hamburger toggle that opens a vertical drawer; the `CompanyProfileSwitcher`, `SyncStatusBadge`, and page-specific `actions` slot stay inline always. Page identifies itself with `current="dashboard|clients|settings"` so the active route is excluded from the nav set automatically.

**Why:** Three routes previously duplicated identical header markup (DRY violation). User reported the top menu was not mobile-friendly. Single shared component fixes both: SRP for the nav, responsive behavior in one place.

**How to apply:**
- Pages pass `title`, `current`, and optional `actions` (page-specific CTA like dashboard's "Nauja sąskaita").
- Adding a new top-level page → extend `AppHeaderPage` union + `NAV_LINKS` map in `AppHeader.tsx`.
- Invoice editor uses a different header layout (workspace pattern) — keep it separate.
- Subtitle (user email vs "In-memory dev rėžimas") is derived inside `AppHeader`; pages do not pass it.
