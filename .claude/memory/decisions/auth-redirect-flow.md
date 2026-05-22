---
name: auth-redirect-flow
description: Protected routes use RequireAuth wrapper + expiry watchdog; unauth redirects to /login?from=<href>, login returns to from.
keywords: auth, require-auth, redirect, from, login, session-expiry, watchdog, isRestoring
created: 2026-05-22
updated: 2026-05-22
---

**Fact / Rule:** All protected routes (`/dashboard`, `/settings`, `/clients`, `/invoice-editor/$id`) are wrapped with `<RequireAuth>` in `src/router.tsx`. Login route accepts `?from=<local-path>` and after login navigates there via `resolveRedirectTarget()`.

`InnerAuthProvider` exposes `isRestoring` (true until localStorage session is checked + user fetched) and runs an expiry watchdog: `setTimeout` at `expiresAt` calls `logout()` — which clears state → RequireAuth redirects.

`RequireAuth`:
- `env.useInMemory` → render children (bypass).
- `isRestoring` → render null (avoid login flash on reload).
- `!isAuthenticated` → `<Navigate to="/login" search={{ from: location.href }} replace />`.

`resolveRedirectTarget(from)` in `src/lib/auth/redirectTarget.ts`: rejects absolute urls, protocol-relative (`//`), non-`/` paths, and `/login*` (loop). Default `/dashboard`.

**Why:** Before this, `useStorage()` would throw "Storage not ready — user is not authenticated" when session silently expired, leaving user stuck on a generic error screen with no way back. User reported it as a major UX bug.

**How to apply:** When adding a new protected route, wrap its component with `<RequireAuth>` in `router.tsx`. Never rely on the `useStorage()` throw to gate access — the throw is a last-resort invariant, not a flow control. If you need to add a new auth-bypass mode beside `useInMemory`, add it inside `RequireAuth` early-return.

Related: [[auth-session-persistence]]
