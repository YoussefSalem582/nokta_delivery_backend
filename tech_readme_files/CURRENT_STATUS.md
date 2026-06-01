# Nokta Backend — Current Project Status

> [INDEX](INDEX.md) > Current Status
>
> **Last Updated:** June 1, 2026 — AI agent documentation surface added.
> **Version:** `0.1.0`
> **Node:** 22+
> **Status:** ✅ MVP API complete | 🚧 Production hardening / Flutter wire-up ongoing

## Executive Summary

NestJS production API for Nokta with Prisma/PostgreSQL, Redis, Socket.io, BullMQ notifications, JWT auth, bilingual message keys, and Flutter-compatible trip/driver paths.

### Key Highlights

- ✅ **Auth** — register, login, refresh, logout, device tokens
- ✅ **Rides** — request, status, fare estimate, driver offers/accept/location
- ✅ **Deliveries** — CRUD, tracking, orders alias
- ✅ **Sync** — idempotency + offline action queue + reconcile
- ✅ **Admin** — users, rides, deliveries, analytics, audit logs
- ✅ **Real-time** — Socket.io location broadcast
- ✅ **Docs** — Swagger, `docs/API.md`, OpenAPI export, Postman
- ✅ **Agent docs** — AGENTS.md, 3 skills, Cursor/Claude/Codex/Copilot shims

## Feature Status

| Area | Status |
|------|--------|
| Auth (JWT + roles) | ✅ Complete |
| Trips / ride-hailing | ✅ Complete |
| Driver APIs (`/v1/driver/*`) | ✅ Complete |
| Deliveries + `/orders` | ✅ Complete |
| Profile | ✅ Complete |
| Offline sync + idempotency | ✅ Complete |
| Push notifications (FCM + queue) | ✅ Complete (requires Firebase env) |
| Socket.io realtime | ✅ Complete |
| Admin APIs | ✅ Complete |
| Flutter app live integration | 🚧 Client uses mock API by default |
| Production deployment | 🚧 Docker Compose ready; cloud TBD |

## Testing

- `npm test` — unit tests for auth, rides, deliveries, idempotency, audit, notifications
- `npm run test:e2e` — e2e API tests

## Documentation

| Doc | Status |
|-----|--------|
| AGENTS.md (canonical) | ✅ |
| tech_readme_files/ | ✅ Initial set |
| CHANGELOG.md | ✅ |
| CI docs workflow | ✅ |
