---
name: runtime-google-fonts
description: PDF fonts loaded at runtime from Google Fonts CSS2 API; never bundle font binaries in source.
keywords: [fonts, google-fonts, pdf, react-pdf, runtime, no-bundle]
created: 2026-05-22
updated: 2026-05-22
metadata:
  type: decisions
---

**Fact / Rule:** PDF font loading goes through `src/lib/pdf/googleFonts.ts` which fetches `fonts.googleapis.com/css2`, parses the @font-face URLs, and calls `Font.register`. No `.ttf`/`.woff2` files in the repo, no `@fontsource/*` package.

**Why:** User explicitly requested no bundled fonts and to use Google's CDN directly. Previously hard-coded gstatic v30 URLs went 404 because Google rotates the per-hash file paths.

**How to apply:**
- Adding a new font option = append to `POPULAR_GOOGLE_FONTS` in `googleFonts.ts`; nothing else.
- Anything that renders PDF must `await ensureGoogleFontRegistered(family)` before `pdf(<Doc/>).toBlob()` (see [[lazy-load-pdf-xlsx]]).
- `resolveFontFamily()` falls back to Roboto for legacy/unknown presets, so old DesignPresetDto values do not break PDF generation.
- Do not import @react-pdf at module top in any file that registers fonts — keep dynamic import to preserve code-split bundle.
- Glyph coverage relies on CSS1 endpoint with `&subset=latin,latin-ext` — Google returns ONE TTF per weight covering full subset (no unicode-range split). Do NOT switch to CSS2 (`/css2?family=...`) — it returns per-subset woff2 files with `unicode-range`, and react-pdf/fontkit cannot do unicode-range fallback (last-registered overwrites prior). Symptom of regression: `RangeError: Offset is outside the bounds of the DataView` from `DataView.setUint16` during PDF generation. TTF format is also more reliable than woff2 for fontkit subsetting.
