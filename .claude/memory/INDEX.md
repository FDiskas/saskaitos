# Memory Index

## project/
- [no-backend-architecture](project/no-backend-architecture.md) — hard constraint: zero infra, all persistence in user's own Google Drive via drive.file. keywords: architecture, backend, google-drive, philosophy

## decisions/
- [resend-client-side](decisions/resend-client-side.md) — Resend called directly from browser with user-supplied key in Drive settings; no proxy. keywords: resend, email, api-key, security
- [lazy-load-pdf-xlsx](decisions/lazy-load-pdf-xlsx.md) — @react-pdf/renderer + xlsx loaded via dynamic import to keep main chunk small. keywords: bundle, lazy-load, pdf, xlsx, code-split
- [overdue-display-inference](decisions/overdue-display-inference.md) — Dashboard infers Overdue via InvoiceSummary.effectiveStatus(today); no auto Drive write. keywords: overdue, status, dashboard, inference, invoice-summary
- [zod-settings-type-bridge](decisions/zod-settings-type-bridge.md) — SettingsDto interface + cast bridges Zod `.default()` inference gap. keywords: zod, settings, dto, type, default
- [auth-session-persistence](decisions/auth-session-persistence.md) — OAuth access_token + expiresAt cached in localStorage, restored on mount; survives reload until token expires. keywords: auth, oauth, session, localStorage, token, persistence

## developer/
- [workflow-style](developer/workflow-style.md) — stage-by-stage vibe-coding prompts with acceptance criteria; replies in Lithuanian. keywords: workflow, vibe-coding, lithuanian, prompts
- [pnpm-package-manager](developer/pnpm-package-manager.md) — use pnpm everywhere, never npm/yarn. keywords: pnpm, package-manager, install, scripts
- [typescript-erasable-syntax](developer/typescript-erasable-syntax.md) — erasableSyntaxOnly is on; no parameter properties / enums. keywords: typescript, erasableSyntaxOnly, classes, parameter-properties
