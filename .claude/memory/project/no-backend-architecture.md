---
name: no-backend-architecture
description: Hard constraint — zero backend, zero hosting. All persistence lives in the end user's own Google Drive via drive.file scope.
keywords: architecture, backend, google-drive, persistence, philosophy, hosting, constraint
created: 2026-05-21
updated: 2026-05-22
---

**Fact / Rule:** This SPA must never grow a backend. Persistence is the signed-in user's own Google Drive (`drive.file` OAuth scope — app only sees files it created). No DB, no server, no API gateway. Static hosting only.

**Why:** The project's reason to exist is "no hosting costs, no infra to maintain, no GDPR exposure on our side" — every byte of customer data stays in the user's own Drive. Adding a backend would erase the whole point.

**How to apply:**
- Reject any proposal that introduces a server, edge function, or hosted DB — even for "small" things like rate limiting or signing. Push the logic client-side or into the user's own Drive JSON files.
- Race conditions and rate limits must be solved client-side (see `stores/syncQueue.ts` — sequential mutation queue).
- Secrets (e.g. Resend API key) belong in the user's `settings.json` on their Drive, not env vars.
- **Runtime is browser-only.** No Node, no SSR, no edge runtime — ever. When picking a library/code path, choose the browser variant (e.g. react-pdf with URL string `src`, NOT Node `ArrayBuffer`/`Buffer` path). If a feature only ships as Node, find a different feature.
- Related decision: [[resend-client-side]], [[runtime-google-fonts]].
