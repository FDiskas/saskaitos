---
name: runtime-google-fonts
description: PDF and preview fonts are served from local public/fonts TTF files to avoid CDN/runtime breakage.
keywords: [fonts, pdf, react-pdf, preview, local-fonts, public, ttf, stability]
created: 2026-05-22
updated: 2026-05-22
metadata:
  type: decisions
---

**Fact / Rule:** PDF and invoice preview fonts must be loaded from local files under `public/fonts/*.ttf` (weights 400/700). No runtime dependency on Google Fonts endpoints for invoice rendering.

**Why:** Runtime Google font loading proved unstable in browser context: CSS responses vary by user-agent and can return only woff2, while direct gstatic paths can rotate and 404. This caused PDF generation errors and preview/PDF mismatch.

**How to apply:**

- Source of truth for PDF registration: `src/lib/pdf/googleFonts.ts` mapping family -> local `/fonts/*.ttf` files.
- Source of truth for browser preview: `src/index.css` has `@font-face` entries for all selectable families and weights.
- Anything that renders PDF must `await ensureGoogleFontRegistered(family)` before `pdf(<Doc/>).toBlob()` (see [[lazy-load-pdf-xlsx]]).
- Adding a new selectable family requires three updates together:
  1. include family in `POPULAR_GOOGLE_FONTS`,
  2. add 400/700 TTF files to `public/fonts/`,
  3. add CSS `@font-face` entries in `src/index.css`.
- Keep PDF dynamic imports (`@react-pdf/renderer`) to preserve code split behavior.
