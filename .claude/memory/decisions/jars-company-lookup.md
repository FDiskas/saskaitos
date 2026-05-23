---
name: jars-company-lookup
description: Jars.lt company-lookup integration; user-supplied API key in Drive settings; manual button trigger to preserve 100/month free quota.
keywords: jars, jars.lt, company-search, api-key, registrų-centras, lookup, integrations
metadata:
  type: decision
---

**Fact / Rule:** Company-name lookup via `https://api.jars.lt/api/v1/companies/search?q=...` lives in `src/lib/jars/`. API key stored as `SettingsDto.jarsApiKey` in Drive (same pattern as `resendApiKey`). Search is triggered **only by explicit button click** next to the company-name input (CompanyTab + ClientFormDialog), never automatically.

**Why:** Free tier capped at 100 requests/month per key. Auto-searching on keystroke or blur would exhaust the quota fast. Errors are mapped to typed exceptions: `JarsKeyError` (401/403) and `JarsApiError` (429 quota / 5xx / shape mismatch).

**How to apply:**
- New surfaces that take a company name → reuse `<JarsCompanySearchButton apiKey={settings.jarsApiKey} query={name} onResult={fillFields} onError={setMsg} />` from `@/components/shared`.
- Don't add debounced / typeahead auto-search — keep it a discrete user action.
- API response is parsed with Zod (`.passthrough()` so unrelated jars fields don't break us); only `code`, `name`, `address`, `pvmCode→vatCode` are surfaced.
- Settings UI for the key is in a separate **Integracijos** tab (not Email), linking to https://jars.lt for signup.

Related: [[resend-client-side]] for the parallel user-supplied-key pattern.
