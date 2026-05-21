---
name: typescript-erasable-syntax
description: tsconfig has erasableSyntaxOnly enabled - forbids parameter properties (`constructor(private x: T)`) and enums; declare explicit fields and assign in body
metadata:
  type: feedback
---

# TS erasableSyntaxOnly is on

tsconfig.app.json has `erasableSyntaxOnly: true`. This blocks:
- Parameter properties: `constructor(private readonly x: T) {}` → must declare field separately and assign in body
- Enums (use union types or `as const` objects instead)
- Namespaces with runtime values

**Why:** Verbatim TS-erasable mode keeps build output identical to TS source with type annotations stripped (no runtime emit beyond JS). Aligns with `verbatimModuleSyntax`.

**How to apply:** When writing classes in this codebase, always declare fields on separate lines:
```ts
class X {
  private readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
}
```
Never use the shorthand `constructor(private readonly value: string)`.
