---
name: deferred-cleanup-followups
description: Known cleanup items intentionally left untouched during the 2026-05-30 codebase audit, with the reason each was deferred.
keywords: cleanup, tech-debt, followups, audit, coverage-v8, useDeleteInvoice, auth-swallow, legacy-migration
created: 2026-05-30
updated: 2026-05-30
---

**Fact / Rule:** The 2026-05-30 8-dimension cleanup left these candidates deliberately untouched (all flagged, none changed):

- `@vitest/coverage-v8` is referenced by `vitest.config.ts` (`provider: 'v8'`) but missing from `package.json` deps — add it or drop the coverage block.
- `useDeleteInvoice` (`hooks/useInvoiceMutations.ts`) is a complete hook with zero call sites (no delete-invoice UI) — kept as a coherent CRUD-trio member, not dead code to remove.
- `GoogleAuthProvider.finalizeLogin` swallows a userinfo-fetch failure into `setUser(null)`, which can leave a valid token with `isAuthenticated=false` and no error shown — UX inconsistency; needs a test before touching. See [[tokenref-race-condition]].
- `migrateLegacyLayoutInput` (`lib/invoice-template/legacy.ts`) migrates a real old persisted Drive layout shape; `DriveStorage.read` uses `schema.parse()` which **throws**, so removal would crash on surviving old data — add a test before any removal. See [[block-instance-model]].

**Why:** Each was low-confidence or behavior-changing without test coverage; the audit mandate was high-confidence-only, revert-on-red. Documenting so they aren't re-discovered from scratch.

**How to apply:** If asked to "finish the cleanup" or touch auth/legacy-migration/coverage, start here. The audit also confirmed a clean baseline: 0 circular deps, no AI-slop comments, all try/catch legitimate. Full per-dimension reports are in `cleanup-reports/` (may have been deleted since).
