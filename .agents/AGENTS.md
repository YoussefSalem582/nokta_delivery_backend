# Agent Instructions — Generic Shim

> **Canonical conventions live in [`../AGENTS.md`](../AGENTS.md).** Read it first.
> This file is a thin shim for generic agents reading from `.agents/`. It contains only the **skill catalog pointer** + folder map.

## Scope

- Edit files **only** inside `nokta_delivery_backend/` (this repo).

## Current feature snapshot (see canonical doc for details)

- NestJS 11 API with Prisma + Redis + Socket.io + BullMQ
- Flutter-compatible trip/driver/delivery paths
- Bilingual `messageKey` responses and idempotency for offline sync
- Live status: [`../tech_readme_files/CURRENT_STATUS.md`](../tech_readme_files/CURRENT_STATUS.md)

## Skills (in this directory)

All skill prompts live in [`./skills/`](./skills/) in universal SKILL.md format. **3 project-tuned skills**:

| Skill | Purpose |
|-------|---------|
| `add-module` | Scaffold module, controller, service, DTOs, unit test stub |
| `add-endpoint` | Add HTTP route through DTO → service → controller + Swagger |
| `add-message-keys` | Add EN + AR keys to `message-keys.ts` and response helpers |

## Where to look

| Need | File |
|------|------|
| Project overview, architecture, API, security | [`../AGENTS.md`](../AGENTS.md) |
| Onboarding & doc-map | [`../tech_readme_files/INDEX.md`](../tech_readme_files/INDEX.md) |
| Troubleshooting | [`../tech_readme_files/TROUBLESHOOTING.md`](../tech_readme_files/TROUBLESHOOTING.md) |
| Common pitfalls | [`../tech_readme_files/COMMON_PITFALLS.md`](../tech_readme_files/COMMON_PITFALLS.md) |
| Architecture decisions | [`../tech_readme_files/decisions/`](../tech_readme_files/decisions/) |
