---
name: zod-settings-type-bridge
description: SettingsDto is declared as an explicit TS interface and bridged to its Zod schema with a `as unknown as z.ZodType<SettingsDto>` cast — works around a Zod 3.25 inference quirk where `.default()` leaves output fields optional in `z.infer`.
keywords: [zod, settings, dto, type, inference, default, cast, schema]
created: 2026-05-22
updated: 2026-05-22
---

**Decision:** `SettingsDto` in `src/lib/drive/settings.ts` is hand-written as a TS interface. The Zod schema is built as `RawSettingsSchema` and then cast: `export const SettingsDtoSchema: z.ZodType<SettingsDto> = RawSettingsSchema as unknown as z.ZodType<SettingsDto>`.

**Why:** Zod 3.25's `.nullable().default(null)` and `.array(...).default([])` infer output as `T | null | undefined` / `T[] | undefined` in the `z.infer<>` type — even though `.parse(undefined)` actually returns the default at runtime. Without bridging, TanStack Query's `setQueryData` / mutation generics see a mismatch between the loose `infer` type and the strict shape we need everywhere else.

**How to apply:**
- For any storage DTO with `.default()` or `.nullable().default()`, declare the TS interface separately and cast the Zod schema once at definition.
- Do NOT add inline `as any` / `as SettingsDto` casts elsewhere in the codebase. The cast lives only in `settings.ts`.
- If Zod 4 lands or the inference is fixed upstream, drop the cast and use `z.infer<typeof SettingsDtoSchema>` again.
- This is the only sanctioned exception to the CLAUDE.md "no unknown casts without Zod parse" rule — the runtime IS still Zod-parsed; the cast only narrows the inferred TS shape.

Related: [[no-backend-architecture]] (Drive-only persistence makes DTO shape critical).
