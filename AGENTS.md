# Nokta Backend — Agent Instructions

<!-- canonical-banner:start -->
> **Canonical source of truth for AI agents.**
> This file is the single authoritative guide for every agent (Cursor, Claude Code, Codex CLI, GitHub Copilot, Gemini, Aider, Windsurf, generic). The per-tool instruction files below are **thin shims** that pull in tool-specific runtime conventions and reference this document for everything else — do **not** duplicate content from this file into them.
>
> | Tool | Shim file | What lives only in the shim |
> |------|-----------|------------------------------|
> | All / generic | [.agents/AGENTS.md](.agents/AGENTS.md) | Skill folder location |
> | Claude Code | [CLAUDE.md](CLAUDE.md) | Tool-use rules, response style, slash-commands (`.claude/commands/`) |
> | OpenAI Codex CLI | [.codex/AGENTS.md](.codex/AGENTS.md) | Approval-mode mapping, `apply_patch` preference |
> | GitHub Copilot | [.github/copilot-instructions.md](.github/copilot-instructions.md) | Inline-completion + Copilot-Chat conventions |
> | Cursor | [CURSOR.md](CURSOR.md) + [.cursor/rules/](.cursor/rules/) `*.mdc` | Auto-attached rule scopes |
>
> **If you edit project conventions, edit this file.** Shims should never grow back into full mirrors.
<!-- canonical-banner:end -->

> **Scope**: Only modify files inside `nokta_delivery_backend/` (this repo). Flutter client lives in `nokta_delivery_app/`.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Entry Points](#key-entry-points)
- [Module Architecture](#module-architecture)
- [API Conventions](#api-conventions)
- [Flutter Compatibility](#flutter-compatibility)
- [Database & Prisma](#database--prisma)
- [Real-time & Jobs](#real-time--jobs)
- [Security](#security)
- [Testing](#testing)
- [Naming Conventions](#naming-conventions)
- [Mandatory Documentation (after every change)](#mandatory-documentation-after-every-change)
- [Approved Commands (no user prompt required)](#approved-commands-no-user-prompt-required)
- [Available Skills](#available-skills)

## Project Overview

Production NestJS API for **Nokta** — Egypt-focused ride-hailing and delivery. Current version: **`0.1.0`**.

- **Framework**: NestJS 11 + TypeScript
- **Database**: PostgreSQL via Prisma
- **Cache / live state**: Redis (ioredis)
- **Real-time**: Socket.io (`src/realtime/`)
- **Queues**: BullMQ (notification retries)
- **Auth**: JWT access + refresh tokens; roles `RIDER`, `DRIVER`, `COURIER`, `ADMIN`
- **Push**: Firebase Admin SDK
- **Validation**: `class-validator` DTOs + global `ValidationPipe`
- **Docs**: Swagger at `/api/docs`; exports in `docs/openapi/`
- **Client**: Flutter app in `../nokta_delivery_app` — paths and trip JSON shapes must stay compatible
- **Platform**: Windows 11 development (PowerShell-first scripts)

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/main.ts` | Bootstrap, global prefix, Swagger, CORS, validation |
| `src/app.module.ts` | Root module imports |
| `src/config/configuration.ts` | Env-backed config |
| `src/config/env.validation.ts` | Env schema validation |
| `src/database/prisma.service.ts` | Prisma client lifecycle |
| `src/common/messages/message-keys.ts` | Bilingual `messageKey` constants |
| `src/common/responses/api-response.ts` | Standard success envelope |
| `src/common/mappers/status.mapper.ts` | Prisma ↔ Flutter status strings |
| `src/common/interceptors/idempotency.interceptor.ts` | Offline `Idempotency-Key` handling |
| `docs/API.md` | Human-readable API reference |
| `prisma/schema.prisma` | Database schema |

## Module Architecture

Feature modules live under `src/modules/<domain>/`:

```
src/modules/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts    # HTTP routes, guards, Swagger decorators
├── <domain>.service.ts       # Business logic
├── dto/                      # class-validator DTOs
└── *.spec.ts                 # Unit tests (co-located)
```

Shared cross-cutting code:

| Path | Purpose |
|------|---------|
| `src/common/` | Guards, decorators, filters, interceptors, mappers, message keys |
| `src/config/` | Configuration module |
| `src/database/` | Prisma + Redis modules |
| `src/realtime/` | Socket.io gateways |
| `src/jobs/` | BullMQ processors |

**Dependency rule**: Controllers → Services → Prisma/Redis/other services. Keep business logic out of controllers. No direct Prisma calls from controllers.

## API Conventions

### Response envelopes

Mutations that use the standard wrapper return:

```json
{
  "success": true,
  "messageKey": "auth.login.success",
  "message": { "en": "...", "ar": "..." },
  "data": {}
}
```

Use helpers in `src/common/responses/api-response.ts` and keys in `src/common/messages/message-keys.ts`.

### Trip / delivery resources (Flutter-compatible)

List/detail endpoints return **plain JSON** with Flutter status strings (`inProgress`, `driverArrived`, etc.) via `status.mapper.ts` — not Prisma enum names in API responses.

### Routes

- Global prefix: `api` (configurable via `API_PREFIX`)
- Auth: `/api/v1/auth/*`
- Trips: `/api/trips/*` (Flutter paths)
- Driver: `/api/v1/driver/*`
- Deliveries + orders alias: `/api/deliveries/*`, `/api/orders`
- Sync: `/api/v1/sync/*`
- Admin: `/api/v1/admin/*` (`ADMIN` role)
- Health: `/api/health`, `/api/health/ready`

### Idempotency

`POST`/`PATCH`/`PUT` may include `Idempotency-Key` header; handled by `IdempotencyInterceptor`.

## Flutter Compatibility

When adding or changing trip/driver/delivery endpoints, verify against:

- `nokta_delivery_app/lib/core/network/api_endpoints.dart`
- `docs/API.md` and Postman collection under `docs/postman/`

After controller/DTO changes, regenerate OpenAPI:

```bash
npm run docs:openapi
```

## Database & Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `npm run prisma:migrate`
- Seed: `npm run prisma:seed` (demo admin + rider)
- Never edit generated `node_modules/.prisma` by hand

## Real-time & Jobs

- Socket.io namespace `/realtime` — `joinRide`, `driverLocation`, `rideLocation`
- Notifications queued via BullMQ — `src/jobs/notification.processor.ts`

## Security

- Never commit `.env` — use `.env.example` as template
- JWT secrets via `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- Firebase credentials via env vars only
- Use `@Roles()` + guards from `src/common/guards/`
- Hash passwords with bcrypt in `auth.service.ts`

## Testing

- Unit: `*.spec.ts` next to services (`jest`)
- E2E: `test/` with `jest-e2e.json`
- Run `npm test` after substantive service changes
- Prefer testing services with mocked Prisma over full e2e for small fixes

## Naming Conventions

| Item | Convention |
|------|------------|
| Files | `kebab-case` for modules; `*.service.ts`, `*.controller.ts` |
| Classes | `PascalCase` |
| Methods/vars | `camelCase` |
| Prisma models | `PascalCase` in schema; table names `snake_case` via `@@map` |
| Message keys | `domain.action.result` (e.g. `auth.login.success`) |

## Mandatory Documentation (after every change)

1. `CHANGELOG.md` — add entry under `[Unreleased]` (Keep a Changelog format)
2. `tech_readme_files/DOCUMENTATION_UPDATE_SUMMARY.md` — dated entry at top
3. `tech_readme_files/CURRENT_STATUS.md` — update feature status and metrics

## Approved Commands (no user prompt required)

| Category | Command |
|----------|---------|
| Node/Nest | `npm install`, `npm run build`, `npm run start:dev`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run format` |
| Prisma | `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`, `npm run prisma:studio` |
| Docs | `npm run docs:openapi` |
| Doc tooling | `.\scripts\sync_ai_ignores.ps1`, `.\scripts\sync_ai_ignores.ps1 -Check`, `.\scripts\check_docs_freshness.ps1` |
| Lint | `npx markdownlint-cli2 "**/*.md"` |

## Available Skills

All skill prompts live in `.agents/skills/` — auto-discovered by Cursor, Claude Code, Codex, Copilot, and other agents.

| Skill | When to use |
|-------|-------------|
| `add-module` | Scaffold a new NestJS feature module (module, controller, service, DTOs, tests) |
| `add-endpoint` | Add an HTTP endpoint end-to-end (DTO, service, controller, Swagger, message keys) |
| `add-message-keys` | Add bilingual API message keys (EN + AR) |

Cursor copies of project skills: [`.cursor/skills/`](.cursor/skills/) — keep in sync when editing project skills.
