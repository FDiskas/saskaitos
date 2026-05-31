# Memory Index

## project/

- [no-backend-architecture](project/no-backend-architecture.md) — hard constraint: zero infra, all persistence in user's own Google Drive via drive.file. keywords: architecture, backend, google-drive, philosophy
- [shared-app-header](project/shared-app-header.md) — AppHeader is single shared top nav for dashboard/clients/settings with mobile hamburger drawer. keywords: header, navigation, responsive, mobile, app-header
- [in-picker-client-creation](project/in-picker-client-creation.md) — NewInvoicePicker has inline "Sukurti naują klientą" button that opens ClientFormDialog without leaving invoice flow. keywords: client, picker, invoice, dialog, inline, create
- [opensource-repo](project/opensource-repo.md) — MIT open-source repo github.com/FDiskas/saskaitos; AppFooter shows link in dashboard/clients/settings. keywords: opensource, github, license, mit, footer, app-footer
- [deferred-cleanup-followups](project/deferred-cleanup-followups.md) — items left untouched in 2026-05-30 audit (missing coverage-v8 dep, unused useDeleteInvoice, auth swallow, legacy migration) + clean baseline. keywords: cleanup, tech-debt, followups, audit, coverage-v8

## decisions/

- [resend-client-side](decisions/resend-client-side.md) — Resend called directly from browser with user-supplied key in Drive settings; no proxy. keywords: resend, email, api-key, security
- [lazy-load-pdf-xlsx](decisions/lazy-load-pdf-xlsx.md) — @react-pdf/renderer + xlsx loaded via dynamic import to keep main chunk small. keywords: bundle, lazy-load, pdf, xlsx, code-split
- [overdue-display-inference](decisions/overdue-display-inference.md) — Dashboard infers Overdue via InvoiceSummary.effectiveStatus(today); no auto Drive write. keywords: overdue, status, dashboard, inference, invoice-summary
- [zod-settings-type-bridge](decisions/zod-settings-type-bridge.md) — SettingsDto interface + cast bridges Zod `.default()` inference gap. keywords: zod, settings, dto, type, default
- [auth-session-persistence](decisions/auth-session-persistence.md) — OAuth access_token + expiresAt cached in localStorage, restored on mount; survives reload until token expires. keywords: auth, oauth, session, localStorage, token, persistence
- [auth-redirect-flow](decisions/auth-redirect-flow.md) — RequireAuth wrapper + expiry watchdog; /login?from=<href>, validated by resolveRedirectTarget. keywords: auth, redirect, from, require-auth, login, session-expiry
- [runtime-google-fonts](decisions/runtime-google-fonts.md) — invoice PDF/preview fonts served locally from public/fonts TTF files for stable rendering. keywords: fonts, pdf, preview, local-fonts, public, ttf
- [row-selection-without-minheight](decisions/row-selection-without-minheight.md) — row selected in canvas configures right sidebar; minHeight removed due to preview/PDF instability. keywords: row, sidebar, minheight, layout, preview, pdf
- [per-line-vat-on-invoice-lines](decisions/per-line-vat-on-invoice-lines.md) — VAT lives on line items; totals sum per-line VAT; global VAT action applies one rate to all lines. keywords: vat, pvm, line-item, totals, bulk-update
- [block-instance-model](decisions/block-instance-model.md) — column.content is BlockInstance[] with per-instance settings; decor kinds (divider, custom-image) allowed multiple per layout; legacy auto-migrated. keywords: layout, block-instance, divider, image, decor, migration
- [pdf-palette-colors](decisions/pdf-palette-colors.md) — preset/override expose 6 colors (primary/accent/text/muted/border/heading); PDF uses PdfPalette, no hardcoded grays. keywords: palette, colors, design-preset, override, pdf
- [jars-company-lookup](decisions/jars-company-lookup.md) — manual-button jars.lt company search; user key in Drive settings; 100/mo free quota → no auto-fire. keywords: jars, company-search, api-key, lookup, integrations
- [invoice-company-scoping](decisions/invoice-company-scoping.md) — invoices carry optional companyId; dashboard implicitly filters by active company; legacy entries → first profile. keywords: invoice, company, multi-company, filter, dashboard, companyId
- [language-sync-priority](decisions/language-sync-priority.md) — useLanguageSync: Drive wins on first load (didInitialSync ref), UI wins after; useLanguage() in useTranslate is intentional re-render subscription. keywords: language, sync, race-condition, useLanguageSync, useTranslate, i18n
- [react-layering](decisions/react-layering.md) — src/lib React-agnostic; Providers in src/providers/ split into Provider.tsx + context.ts; hooks in src/hooks/. keywords: architecture, layering, providers, hooks, lib, react-context, fast-refresh

## incidents/

- [tokenref-race-condition](incidents/tokenref-race-condition.md) — Drive API 403 after auth refactor: tokenRef must be initialized with stored token, not null. keywords: tokenRef, drive, 403, race-condition, auth, GoogleAuthProvider
- [pdf-dataview-font-race](incidents/pdf-dataview-font-race.md) — PDF download crashed with DataView RangeError: inflight font cache was deleted after load, causing re-registration that wiped font store mid-render. keywords: pdf, dataview, font, race-condition, googleFonts, crash

## developer/

- [workflow-style](developer/workflow-style.md) — stage-by-stage vibe-coding prompts with acceptance criteria; replies in Lithuanian. keywords: workflow, vibe-coding, lithuanian, prompts
- [pnpm-package-manager](developer/pnpm-package-manager.md) — use pnpm everywhere, never npm/yarn. keywords: pnpm, package-manager, install, scripts
- [typescript-erasable-syntax](developer/typescript-erasable-syntax.md) — erasableSyntaxOnly is on; no parameter properties / enums. keywords: typescript, erasableSyntaxOnly, classes, parameter-properties
