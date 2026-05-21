---
name: resend-client-side
description: Resend email sent directly from browser with user's own API key stored in Drive settings.json — no proxy.
keywords: resend, email, api-key, security, no-proxy, settings
created: 2026-05-21
updated: 2026-05-21
---

**Fact / Rule:** Resend emails are sent via `fetch` directly from the browser. Each user supplies their own Resend API key in Settings; the key persists in `settings.json` on the user's Drive. There is no Cloudflare Worker / Vercel function in front of it.

**Why:** Considered Cloudflare Worker proxy and Vercel Edge Function during planning. Both were rejected because they reintroduce infra to maintain (contradicts [[no-backend-architecture]]). Trade-off accepted: the user is responsible for their own Resend account and verified domain. Resend CORS allows browser POSTs.

**How to apply:**
- Never propose hiding the key behind a server. If key exposure becomes a real concern, the answer is per-user keys (already the design), not a proxy.
- Resend `from` requires a verified domain — Settings UI must surface this clearly with a link to resend.com/domains.
- If `settings.resendApiKey` is missing, disable the Send button (don't fall back to any shared key).
