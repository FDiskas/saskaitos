---
name: workflow-style
description: User prefers stage-by-stage vibe-coding workflow — discrete prompts with acceptance criteria per phase, not big-bang implementation.
keywords: workflow, vibe-coding, prompts, lithuanian, communication, staging
created: 2026-05-21
updated: 2026-05-21
---

**Fact / Rule:** User drives implementation by feeding numbered stage prompts to AI tools (Cursor / Claude Code / Lovable), committing between stages. Plans should be structured as executable stage prompts with explicit acceptance criteria per stage.

**Why:** Stated preference during planning ("Paruosk issamu plana skirta AI - vibe codinimui"). Lets the user rollback a single stage if the AI breaks something, instead of debugging a 5000-line bulk generation.

**How to apply:**
- When proposing implementation plans, structure as Stage 0..N with: prompt block, acceptance criteria, dependencies between stages explicit.
- Default response language: Lithuanian (user writes in LT and prefers replies in LT).
- Don't bundle multiple unrelated changes into one stage — each stage should be independently committable and revertible.
- User values clean code: strict TS (no `any`), Zod for all external boundaries, pure utility functions in `lib/utils/`, components < 200 lines. These rules belong in project `CLAUDE.md`.
