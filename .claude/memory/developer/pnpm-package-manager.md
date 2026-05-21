---
name: pnpm-package-manager
description: User uses pnpm everywhere — never npm or yarn. All install/run/exec commands must use pnpm.
keywords: pnpm, package-manager, npm, yarn, install, scripts
created: 2026-05-21
updated: 2026-05-21
---

**Fact / Rule:** Use `pnpm` for every package operation across all projects. Never `npm` or `yarn`.

**Why:** Explicitly stated preference ("visur naudojam pnpm").

**How to apply:**
- Install: `pnpm install`, `pnpm add <pkg>`, `pnpm add -D <pkg>`
- Run scripts: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm <script>`
- Execute binaries: `pnpm dlx <cmd>` (not `npx`)
- Workspace: `pnpm -F <pkg> <cmd>` for monorepos
- Lockfile: commit `pnpm-lock.yaml`, never `package-lock.json` or `yarn.lock`
- When generating plans, READMEs, CI configs — use pnpm commands by default. No `npm install` / `npm run` anywhere.
