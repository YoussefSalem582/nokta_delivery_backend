# Copilot Instructions — Shim

> **Canonical conventions live in [`../AGENTS.md`](../AGENTS.md).**
> Read that file first. This file contains **only Copilot-specific runtime guidance**.

## Project scope

- Modify files **only** inside `nokta_delivery_backend/`.

## Copilot-specific behavior

### Inline completion

- **Never invent** hardcoded JWT secrets, database URLs, or Firebase keys — use `ConfigService` and env vars.
- When completing controllers, use existing guards (`JwtAuthGuard`, `@Roles()`) and DTOs with `class-validator` decorators.
- Trip/delivery responses: map Prisma status through `src/common/mappers/status.mapper.ts` for Flutter-compatible strings.

### Copilot Chat conventions

- For architecture questions, read `tech_readme_files/decisions/` or `tech_readme_files/02_architecture.md`.
- For tests: co-locate `*.spec.ts` with services; mock `PrismaService`.
- For new endpoints: defer to `.agents/skills/` (`add-endpoint`, `add-module`, `add-message-keys`).

### Comment-trigger generation

- New module → `*.module.ts` + controller + service + register in `app.module.ts`.
- New route → DTO + service method + `@Api*` Swagger decorators + message key if mutation.
- Offline writes → ensure `Idempotency-Key` support on mutating routes where applicable.

### Windows / PowerShell

Suggest `.ps1` scripts under `scripts/`, not `.sh`. Use `;` instead of `&&`.

## Where to look

| Need | Location |
|------|----------|
| Project conventions | [`../AGENTS.md`](../AGENTS.md) |
| Skills | [`../.agents/skills/`](../.agents/skills/) |
| Doc index | [`../tech_readme_files/INDEX.md`](../tech_readme_files/INDEX.md) |
