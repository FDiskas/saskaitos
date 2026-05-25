---
name: react-layering
description: src/lib React-agnostic; React Context Providers live in src/providers/ with Context split into separate .ts file from Provider .tsx
keywords: architecture, layering, providers, hooks, lib, react-context, fast-refresh, storage-provider, google-auth-provider
created: 2026-05-24
updated: 2026-05-24
---

**Rule:** Three-layer separation for React stuff:
- `src/lib/` — React-agnostic infrastructure. NO imports from `react`, NO Providers, NO hooks. Pure TS + Zod schemas only (`Storage`, `DriveStorage`, `InMemoryStorage`, domain, drive client, etc.).
- `src/providers/` — React Context Providers. Each Provider split into TWO files:
  - `XyzProvider.tsx` — only the Provider component
  - `xyzContext.ts` — `createContext(...)`, types, detached/default values
- `src/hooks/` — React hooks only. Hook reads Context from `@/providers/xyzContext`, never from the Provider file.

**Why:**
1. `lib/` staying React-free was already CLAUDE.md rule for domain but `StorageContext.tsx` had leaked React into `lib/storage/` and `useGoogleAuth.tsx` had a 200-line Provider sitting in `hooks/` (a Provider is not a hook). Refactored 2026-05-24.
2. Splitting Context into a separate `.ts` file suppresses `react-refresh/only-export-components` warnings — HMR keeps state when editing the Provider.

**How to apply:**
- New Context? Create `src/providers/fooContext.ts` (Context + types + defaults) and `src/providers/FooProvider.tsx` (Provider component).
- New hook that reads Context? Put in `src/hooks/useFoo.ts`, import from `@/providers/fooContext`.
- Barrel: `@/providers` exports Providers + Contexts + types. `@/hooks` exports hooks only — never Providers or Context types.
- `App.tsx` imports Providers from `@/providers`, hooks from `@/hooks`.

See [[opensource-repo]] for project layout context.
