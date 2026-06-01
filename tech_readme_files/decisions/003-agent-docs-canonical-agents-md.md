# ADR 003 — Canonical AGENTS.md + Tool Shims

**Status:** Accepted

## Context

Multiple AI tools (Cursor, Claude Code, Codex, Copilot) need consistent project conventions without duplicated maintenance.

## Decision

- Single canonical [`AGENTS.md`](../../AGENTS.md) at repo root
- Thin shims per tool (`CURSOR.md`, `CLAUDE.md`, `.codex/`, `.github/copilot-instructions.md`)
- Project skills in `.agents/skills/`; Cursor copies in `.cursor/skills/`
- Doc hygiene via `scripts/docs/` and CI `docs.yml`

## Consequences

- Edit conventions in `AGENTS.md` first; shims stay minimal
