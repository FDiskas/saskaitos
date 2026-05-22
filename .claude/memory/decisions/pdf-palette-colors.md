---
name: pdf-palette-colors
description: DesignPreset/DesignOverride expose 6 colors (primary, accent, text, muted, border, heading). PDF + canvas pull from a single PdfPalette/CanvasPalette object — no hardcoded grays.
keywords: design-preset, palette, colors, primary, accent, text, muted, border, heading, override
created: 2026-05-23
updated: 2026-05-23
metadata:
  type: decision
---

**Fact / Rule:** `DesignPresetDto` and `Invoice.designOverride` each expose six colors: `primaryColor`, `accentColor`, `textColor`, `mutedColor`, `borderColor`, `headingColor`. PDF styles (`InvoicePdfStyles.ts`) take a `PdfPalette` object; canvas builds the same shape. All previously-hardcoded grays (#0f172a body, #64748b muted, #cbd5e1 borders, #94a3b8 headings) are now palette references.

**Why:** PDF output mixed many shades the user couldn't configure — only primary + accent were exposed. Adding 4 more colors covers the visible palette without exploding into per-element controls.

**How to apply:**
- Defaults live in `src/lib/drive/settings.ts` as `DEFAULT_TEXT_COLOR` / `DEFAULT_MUTED_COLOR` / `DEFAULT_BORDER_COLOR` / `DEFAULT_HEADING_COLOR`. Preset Zod schema applies them via `.default()`, so old presets in Drive parse cleanly.
- `Invoice.withDesignOverride` accepts any subset of the six colors. Sidebar uses one shared `ColorPickerRow` driven by `COLOR_ROWS` config.
- PDF colors flow: `override ?? preset ?? DEFAULT_*` → `PdfPalette` → `getPdfStyles(palette, fontStack)`. Canvas mirrors this via `CanvasPalette`.
- When adding a new color slot, extend (1) `DesignPresetDtoSchema`, (2) `DesignOverride` interface in `Invoice.ts`, (3) `DesignOverrideDtoSchema`, (4) `PdfPalette`/`CanvasPalette`, (5) `COLOR_ROWS` in `DesignSidebar.tsx`, (6) default constant + `defaultSettings()`.
- Related: [[block-instance-model]].
