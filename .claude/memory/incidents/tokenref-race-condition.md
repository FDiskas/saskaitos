---
name: tokenref-race-condition
description: Drive API 403 after auth refactor — tokenRef initialized to null while accessToken was already set from localStorage
keywords: [tokenRef, drive, 403, race-condition, useRef, localStorage, auth, GoogleAuthProvider]
created: 2026-05-25
updated: 2026-05-25
---

**Fact / Rule:** `tokenRef` in `GoogleAuthProvider.tsx` has TWO sync points that must be correct:
1. Initialized as `useRef<string | null>(validStoredSession?.accessToken ?? null)` (not `null`) for page-reload case.
2. `tokenRef.current = token` must be set **synchronously inside `finalizeLogin`** before calling `setAccessToken(token)`, for the login flow case.

**Why:** `tokenRef` feeds into `AuthInterceptor.getAccessToken()`. `AuthInterceptor` is held inside `DriveStorage` which is created as soon as `hasToken = accessToken !== null`. React's `useEffect` syncs `tokenRef.current = accessToken` but only AFTER the render commit — by which time `useBootstrap` / `useSettings` may already have fired Drive API calls without an Authorization header → Drive returns 403 "unregistered callers".

Two failure scenarios fixed:
- **Page reload**: `tokenRef` was initialized to `null` even when localStorage had a valid token → first Drive request had no auth. Fixed by initializing with `validStoredSession?.accessToken ?? null`.
- **Login flow**: `finalizeLogin` called `setAccessToken(token)` first, causing a re-render where `tokenRef.current` was still `null` (effect not yet run). Fixed by adding `tokenRef.current = token` synchronously before `setAccessToken(token)`.

**How to apply:** Whenever a `useRef` is used as a fast-path proxy for a React state value (to avoid stale closures), keep it in sync at the mutation site — not only via `useEffect`.

See also: [[auth-session-persistence]]
