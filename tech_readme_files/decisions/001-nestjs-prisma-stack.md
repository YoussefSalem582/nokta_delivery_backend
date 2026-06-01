# ADR 001 — NestJS + Prisma + Redis

**Status:** Accepted

## Context

Need a production-ready TypeScript API with relational data, caching, real-time location, and background jobs.

## Decision

- NestJS for modular HTTP + DI
- Prisma for PostgreSQL
- Redis for live location and BullMQ
- Socket.io for realtime broadcasts

## Consequences

- Single deployable monolith; clear module boundaries under `src/modules/`
