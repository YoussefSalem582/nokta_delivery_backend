# Codex CLI Instructions — Shim

> **Canonical conventions live in [`../AGENTS.md`](../AGENTS.md).** Read the canonical doc first; this file contains **only Codex-specific runtime guidance**.

## Codex Runtime Conventions

- **Approval mode**: Default `auto-edit` for documentation, `suggest` for `src/**`, `prisma/**`, `test/**`.
- **Sandbox**: Filesystem writes scoped to `nokta_delivery_backend/` only.
- **Network**: May run `npm install`, `npm run build`, `npm test`, `npm run lint`, `npm run prisma:generate`, and `scripts/*.ps1` without prompting. Other network/git commands need explicit approval.
- **Shell**: Windows 11 / PowerShell — prefer `.ps1` scripts; no bash `&&` chaining.

## Codex-Specific Workflow Tips

1. **Plan first** — numbered list of files + intended changes.
2. **Edit one layer at a time** — DTO → service → controller → module registration.
3. **Verify between layers** — `npm test` for touched `*.spec.ts`.
4. **Update docs last** — CHANGELOG, DOCUMENTATION_UPDATE_SUMMARY, CURRENT_STATUS.

### Tool Selection

- Prefer `apply_patch` over shell `sed`/`awk`.
- Prefer `rg` over `grep`.
- Use `npm run lint` as the project-wide lint check.

## Skills

Codex reads [`../.agents/skills/`](../.agents/skills/) — 3 project-tuned skills. Prefer `add-module`, `add-endpoint`, `add-message-keys` for overlapping workflows.

## Hard Constraints (DO NOT)

- Do NOT hardcode secrets, JWT keys, or Firebase credentials — use `ConfigService` + `.env.example`.
- Do NOT expose Prisma enum names in Flutter trip JSON — use `status.mapper.ts`.
- Do NOT push to remote or amend pushed commits without explicit permission.
- Do NOT skip pre-commit hooks without explicit permission.

## Where to look

| Need | File |
|------|------|
| Canonical conventions | [`../AGENTS.md`](../AGENTS.md) |
| Onboarding | [`../tech_readme_files/INDEX.md`](../tech_readme_files/INDEX.md) |
| Troubleshooting | [`../tech_readme_files/TROUBLESHOOTING.md`](../tech_readme_files/TROUBLESHOOTING.md) |
