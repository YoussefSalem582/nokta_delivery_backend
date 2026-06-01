# Cursor Instructions — Shim

> **Canonical conventions live in [`AGENTS.md`](AGENTS.md).** Read it first.
> This file contains **only Cursor-specific runtime guidance**. Architecture, modules, API conventions, Prisma, security, and the full skill catalog live in the canonical doc.

## Cursor-specific behavior

### Rules (`.cursor/rules/`)

Auto-attached scoped rules mirror `.agents/rules/`:

| Rule file | Scope |
|-----------|-------|
| `project-scope.mdc` | Always — repo boundaries, stack overview |
| `documentation-updates.mdc` | Always — CHANGELOG + status docs after changes |
| `nestjs-module-patterns.mdc` | `src/modules/**` |
| `api-endpoints.mdc` | `src/modules/**/*.controller.ts`, `**/dto/**` |
| `prisma-database.mdc` | `prisma/**`, `src/database/**` |
| `security.mdc` | Auth, env, guards |

Edit conventions in `AGENTS.md` first; update `.cursor/rules/` only when adding tool-specific scopes.

### Skills

- Project skills: [`.agents/skills/`](.agents/skills/) (canonical)
- Cursor copies: [`.cursor/skills/`](.cursor/skills/) — keep in sync with project-tuned skills only

### Composer / Agent mode

- Read `AGENTS.md` + relevant `tech_readme_files/` doc before multi-file edits
- Check [`tech_readme_files/CURRENT_STATUS.md`](tech_readme_files/CURRENT_STATUS.md) for live feature status
- Prefer minimal diffs; match existing NestJS module layout
- Run `npm test` after substantive service changes
- Windows PowerShell — no `&&` chaining
- After controller/DTO changes: `npm run docs:openapi`

### Approved commands (no user prompt needed)

Same as [`AGENTS.md`](AGENTS.md) § Approved Commands.

## Where to look

| Need | File |
|------|------|
| Project conventions | [`AGENTS.md`](AGENTS.md) |
| Claude Code shim (slash commands) | [`CLAUDE.md`](CLAUDE.md) |
| Onboarding | [`tech_readme_files/ONBOARDING.md`](tech_readme_files/ONBOARDING.md) |
| Doc index | [`tech_readme_files/INDEX.md`](tech_readme_files/INDEX.md) |
