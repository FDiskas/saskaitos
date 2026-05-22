---
name: row-selection-without-minheight
description: Row settings moved to right sidebar via row selection; row minHeight removed due to layout instability.
keywords: [invoice-layout, row-selection, sidebar, minheight, canvas, pdf, preview]
created: 2026-05-22
updated: 2026-05-22
---

**Fact / Rule:** Invoice layout rows are configurable via row selection in canvas and right sidebar, and row `minHeight` is no longer part of the layout model.

**Why:** `minHeight` introduced extra rendering and pagination issues across canvas/preview/PDF flows; removing it simplified behavior and reduced layout drift.

**How to apply:** For row-level changes, use selected row state and row actions (columns/remove) in the right settings panel. Estimate visual/pagination height from content density + block margins, not fixed per-row min height.

Related: [[runtime-google-fonts]]
