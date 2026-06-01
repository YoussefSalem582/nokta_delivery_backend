# Changelog

All notable changes to the Nokta Delivery Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Doc-map entry point: [`tech_readme_files/INDEX.md`](tech_readme_files/INDEX.md). Live status: [`tech_readme_files/CURRENT_STATUS.md`](tech_readme_files/CURRENT_STATUS.md).

## [Unreleased]

### Added

- **AI agent documentation surface** — Canonical [`AGENTS.md`](AGENTS.md) plus tool shims ([`CLAUDE.md`](CLAUDE.md), [`CURSOR.md`](CURSOR.md), [`.codex/AGENTS.md`](.codex/AGENTS.md), [`.github/copilot-instructions.md`](.github/copilot-instructions.md)), [`.agents/skills/`](.agents/skills/) (3 project-tuned skills), [`.cursor/rules/`](.cursor/rules/), [`.claude/commands/`](.claude/commands/), [`tech_readme_files/`](tech_readme_files/) doc map, and doc-hygiene scripts + CI ([`.github/workflows/docs.yml`](.github/workflows/docs.yml)).

## [0.1.0] - 2026-06-01

Initial production-oriented NestJS API for Nokta (`0.1.0`).

### Added

- JWT auth with refresh tokens and role-based access (rider, driver, courier, admin)
- Ride-hailing APIs (`/trips`, `/v1/driver/*`) with Flutter-compatible JSON shapes
- Delivery management and `/orders` alias
- Live location (Redis + Socket.io) and BullMQ notification queue
- Offline-first sync with idempotency keys and reconcile endpoints
- Bilingual `messageKey` responses (EN + AR)
- Admin analytics, audit logs, and moderation endpoints
- Swagger UI, OpenAPI export, Postman collection (`docs/`)
- Docker Compose, Prisma schema, seed data, unit and e2e tests

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-06-01 | Initial backend MVP |
