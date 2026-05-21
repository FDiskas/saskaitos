---
name: sync-queue-contract
description: All Drive mutations go through `stores/syncQueue.ts` — singleton, sequential, with `idle / syncing / synced / error` state that `SyncStatusBadge` subscribes to via `useSyncExternalStore`.
keywords: [syncQueue, drive, mutations, sequential, status, badge, optimistic]
created: 2026-05-22
updated: 2026-05-22
---

**Fact:** Persistence to Google Drive is funneled through a single `SyncQueue` instance exported from `src/stores/syncQueue.ts`. Every hook that writes (`useSettings`, future `useClients` / `useInvoiceMutations` / `useInvoiceStatus`) must call `syncQueue.enqueue(() => storage.write(...))`. The queue is FIFO, sequential, and exposes a `subscribe(cb)` for status changes.

**Why:** Drive eventual consistency + 429 rate limits make parallel writes to the same JSON (e.g. `invoices_index.json`) dangerous. Sequentialization prevents lost updates between two optimistic mutations that race on the same file. The status feed lets the UI render a single global badge instead of per-hook spinners.

**How to apply:**
- New mutating hook → wrap the write side in `syncQueue.enqueue(...)`.
- Do not bypass the queue for "small" writes. Even logo uploads go through it.
- The queue resets `error` to `synced` only after a fresh successful run. UI relies on this — don't add a manual `setStatus('idle')` hack.
- Components observing status: use `<SyncStatusBadge />`, do not subscribe directly.

Related: [[zod-settings-type-bridge]], [[no-backend-architecture]].
