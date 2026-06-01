# Claude Code Instructions — Shim

> **Canonical conventions live in [`AGENTS.md`](AGENTS.md).** Read it first.
> This file contains **only Claude-Code-specific runtime guidance** (tool-use rules, response style, slash-commands, approved commands). Architecture, modules, API conventions, Prisma, security, and the full skill catalog all live in the canonical doc.

## Response Guidelines

- Be concise — lead with the action or answer, skip preamble.
- Do not summarize what you just did; the diff speaks for itself.
- Reference files with relative paths (e.g., `src/modules/auth/auth.service.ts`).
- Ask before creating new files that aren't required by the task.
- One task at a time — complete it fully before moving on.
- After every meaningful change: update `CHANGELOG.md`, `tech_readme_files/DOCUMENTATION_UPDATE_SUMMARY.md`, and `tech_readme_files/CURRENT_STATUS.md` (per canonical doc § Mandatory Documentation).

## Environment

- **Platform**: Windows 11 — use PowerShell syntax in Bash commands, not Unix shell.
- **Shell scripts**: Use `.ps1` equivalents (`scripts/sync_ai_ignores.ps1`, `scripts/check_docs_freshness.ps1`).
- **Node**: 22+; run via `npm run <script>`.
- **Approved commands** (no prompt needed):
  - Build / test: `npm install`, `npm run build`, `npm run start:dev`, `npm test`, `npm run test:e2e`, `npm run lint`, `npm run format`
  - Prisma: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`
  - Docs: `npm run docs:openapi`
  - Doc tooling: `.\scripts\sync_ai_ignores.ps1`, `.\scripts\sync_ai_ignores.ps1 -Check`, `.\scripts\check_docs_freshness.ps1`

## Tool-use rules

- **Read before edit**: always read a file before modifying it.
- **Prefer targeted edits** over full rewrites unless warranted.
- **Never hardcode secrets** — use `ConfigService` and `.env.example`.
- **Flutter trip JSON**: use `status.mapper.ts` for client-facing status strings.
- **Bash on Windows**: pwsh-native syntax — no `&&` chaining (use `;` or separate calls). Quote paths with spaces.
- **Don't run interactive commands**: no `git rebase -i`, no interactive Prisma prompts in CI. Pre-fill args.

## Slash commands (`.claude/commands/`)

| Command | Purpose |
|---------|---------|
| `/add-module` | Scaffold a NestJS feature module — alias of skill `add-module` |
| `/add-endpoint` | Wire an HTTP endpoint end-to-end — alias of skill `add-endpoint` |
| `/add-message-keys` | Add bilingual message keys — alias of skill `add-message-keys` |
| `/review` | Audit code against project conventions in canonical `AGENTS.md` |
| `/test` | Run `npm test` or add unit tests for the touched service |
| `/update-docs` | Update `CHANGELOG.md` + `DOCUMENTATION_UPDATE_SUMMARY.md` + `CURRENT_STATUS.md` |

The first three are content-identical to skills in [`.agents/skills/`](.agents/skills/). The other three are Claude-Code-only.

## Skill catalog

3 project-tuned skills live in [`.agents/skills/`](.agents/skills/). Full catalog in [`AGENTS.md`](AGENTS.md) § Available Skills.

## Where to look

| Need | File |
|------|------|
| Project conventions | [`AGENTS.md`](AGENTS.md) |
| Onboarding & doc-map | [`tech_readme_files/INDEX.md`](tech_readme_files/INDEX.md) |
| Troubleshooting | [`tech_readme_files/TROUBLESHOOTING.md`](tech_readme_files/TROUBLESHOOTING.md) |
| Common pitfalls | [`tech_readme_files/COMMON_PITFALLS.md`](tech_readme_files/COMMON_PITFALLS.md) |
| Architecture decisions | [`tech_readme_files/decisions/`](tech_readme_files/decisions/) |
| Glossary | [`tech_readme_files/GLOSSARY.md`](tech_readme_files/GLOSSARY.md) |
