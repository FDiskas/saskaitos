---
name: language-sync-priority
description: useLanguageSync uses didInitialSync ref — Drive wins on first load, UI wins after; useTranslate calls useLanguage() intentionally for re-render subscription.
keywords: [language, sync, useLanguageSync, useTranslate, useLanguage, race-condition, drive, i18n]
created: 2026-05-25
updated: 2026-05-25
---

**Fact / Rule:** `useLanguageSync` uses a `didInitialSync` ref to split authority:
- **Before first sync** (settings arrives from Drive for the first time): Drive settings is authoritative → `setLanguage(settings.language)`.
- **After first sync** (user changes language in footer): UI is authoritative → `update(s => ({...s, language}))` saves to Drive.

**Why:** Without the ref, clicking a flag in the footer triggered `language` change → the effect ran with `settings.language (old) !== language (new)` → called `setLanguage(settings.language)` → **reverted** the user's selection.

**How to apply:** If `useLanguageSync` needs to be touched again, preserve `didInitialSync` logic. Don't simplify to a single bidirectional effect — the race condition will return.

---

**Fact / Rule:** `useTranslate` calls `useLanguage()` with no return value on purpose.

**Why:** `translate` is a mutable module-level singleton (mutated by `setTranslateLanguage`). `useLanguage()` subscribes the component to `LanguageContext` so React re-renders it when the language changes. Without it, components would display stale translated strings even though the singleton updated.
