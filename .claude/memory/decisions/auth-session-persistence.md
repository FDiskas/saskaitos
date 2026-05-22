---
name: auth-session-persistence
description: Google OAuth access token persisted in localStorage with expiry, restored on mount; survives page reload until token expires
keywords: auth, oauth, session, localStorage, persistence, google, token
created: 2026-05-22
updated: 2026-05-22
---

**Fact / Rule:** Auth access_token + expiresAt stored in `localStorage` under key `saskaitos.auth.session` via [src/lib/auth/sessionStore.ts](../../src/lib/auth/sessionStore.ts). On `InnerAuthProvider` mount, valid stored session is restored; expired entries are cleared. `logout()` clears the entry.

**Why:** Implicit OAuth flow (`@react-oauth/google` `useGoogleLogin({flow:'implicit'})`) returns no refresh token in the browser — only `access_token` + `expires_in`. Without persistence, React state is lost on reload and the user must re-click "Prisijungti su Google" every time. Persisting just the access_token (with its own expiry from `expires_in`) keeps the session alive for the ~1h Google grants.

**How to apply:**
- Token lifetime is bounded by `expires_in` minus 60s safety buffer (see `SAFETY_BUFFER_SECONDS` in sessionStore).
- After natural expiry, the `REFRESH_INTERVAL_MS` (55min) timer in [src/hooks/useGoogleAuth.tsx](../../src/hooks/useGoogleAuth.tsx) attempts silent refresh via `triggerLogin({prompt:''})`; on `onSuccess` `finalizeLogin` re-saves the session.
- Do not store anything else (refresh tokens, user PII) here — userinfo is re-fetched on restore. If `fetchUserInfo` fails the stored session is cleared (token revoked/invalid).
- Related: [[no-backend-architecture]] — all sensitive data stays on the user's machine; no server-side session.
