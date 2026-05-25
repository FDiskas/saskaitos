---
name: pdf-dataview-font-race
description: PDF download crashed with DataView RangeError due to font re-registration race in googleFonts.ts
keywords: [pdf, dataview, font, race-condition, inflight, done-cache, googleFonts, crash]
created: 2026-05-25
updated: 2026-05-25
---

**Fact / Rule:** `@react-pdf/renderer` PDF generation crashed with `RangeError: Offset is outside the bounds of the DataView` because `googleFonts.ts` used a temporary `inflight` map that deleted the promise in `finally` after each font load. A second concurrent caller (e.g. preview + download) would restart `registerAndLoad`, which called `clearStaleSources` and deleted the font from `Font`'s internal store while the first PDF was still using it — causing fontkit to read corrupted/incomplete font data.

**Why:** `fontkit` (used internally by `@react-pdf/renderer`) parses TTF binary data into `DataView`. If the font store is wiped mid-render, fontkit gets a zero-length or empty buffer and throws `Offset is outside the bounds of the DataView`.

**Fix applied (2026-05-25):**
- Added permanent `done: Map<string, FontStack>` — once a font is loaded it's cached forever.
- `inflight` now deduplicates concurrent callers during the in-progress load, then moves result to `done` (not deleted).
- Removed `clearStaleSources` and the `Font.getRegisteredFonts()` store manipulation entirely — never clear registered fonts.
- File: `src/lib/pdf/googleFonts.ts`.

**How to apply:** Never call `Font.getRegisteredFonts()` and mutate the result during PDF generation. If a font needs to be refreshed, only do it outside of any active PDF render.
