---
name: block-instance-model
description: Invoice layout columns hold BlockInstance[] (id+kind+per-instance data), not BlockId[]; settings live on the instance itself. Decor kinds (divider, custom-image) allowed multiple per layout.
keywords: layout, block-instance, divider, custom-image, decor, blocksettings, schema-migration
created: 2026-05-23
updated: 2026-05-23
metadata:
  type: decision
---

**Fact / Rule:** `InvoiceTemplateColumnDto.content` is `BlockInstance[]`. Each instance carries `id`, `kind`, `align`, `marginTop`, `marginBottom` directly — no separate `blockSettings` map. Decor kinds (`divider`, `custom-image`) carry per-instance data on the instance object (dividerStyle/Thickness/Color, imageBase64/imageMaxWidthPct).

**Why:** Originally `content: TemplateBlockId[]` with a parallel `blockSettings` map keyed by kind. That model dedupes by kind, blocking multiple dividers or multiple custom images per invoice. Migration was driven by adding decor blocks.

**How to apply:**
- Data kinds (logo, seller-info, buyer-info, invoice-meta, line-items, totals, notes, signature) remain singletons — UI enforces "one per layout" by reusing the existing instance on library re-drop (`findDataBlockInstance` + `moveBlockInstanceToColumn`).
- Decor kinds are unbounded: every library drop creates a new instance via `createBlockInstance(kind)`.
- Persisted legacy layouts (`content: string[]` + `blockSettings`) are auto-migrated in `settings.ts` via `migrateLegacyLayoutInput` (Zod preprocess). Legacy instance IDs are `legacy-${kind}` — stable across reload.
- Components dispatch on `instance.kind` (discriminated union). Add `if (instance.kind === 'X')` branches in both [[invoice-canvas-render]] (`InvoiceCanvas.renderInstanceContent`) and PDF (`InvoicePdfDocument.renderInstance`).
- See [[pdf-palette-colors]] for the parallel color palette expansion shipped at the same time.
